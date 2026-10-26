import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router'
import { useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { createChatSocket, type ChatSocket } from '../api/chatSocket'
import {
  type ConversationListItem,
  conversationsQueryKey,
  toConversation,
  useConversations,
} from '../api/conversationsApi'
import {
  markConversationRead,
  type ConversationMessage,
  type MessagesPage,
  messagesQueryKey,
  sendMessage,
  useConversationMessages,
} from '../api/messagesApi'
import ChatHeader from './ChatHeader'
import EmptyState from './EmptyState'
import MessageInput from './MessageInput'
import MessageList from './MessageList'
import Sidebar from './Sidebar'

export default function ChatLayout() {
  const { conversationId } = useParams()
  const accessToken = useAuthStore((state) => state.accessToken)
  const userId = useAuthStore((state) => state.user?.id ?? '')
  const conversationsQuery = useConversations(userId)
  const conversations = conversationsQuery.data?.map((item) => toConversation(item, userId)) ?? []
  const selected = conversations.find((conversation) => conversation.id === conversationId)
  const queryClient = useQueryClient()
  const socketRef = useRef<ChatSocket | null>(null)
  const connectionErrorShown = useRef(false)
  const activeConversationIdRef = useRef(conversationId)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [typingConversationId, setTypingConversationId] = useState<string | null>(null)
  const messagesQuery = useConversationMessages(conversationId ?? '')
  const selectedMessages = useMemo(
    () => messagesQuery.data?.pages.flatMap((page) => page.messages).reverse() ?? [],
    [messagesQuery.data],
  )

  useEffect(() => {
    activeConversationIdRef.current = conversationId
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
  }, [conversationId])

  useEffect(() => {
    if (!accessToken) {
      return
    }

    const chatSocket = createChatSocket(accessToken)
    const handleNewMessage = (message: ConversationMessage) => {
      queryClient.setQueryData<InfiniteData<MessagesPage, string | null>>(
        messagesQueryKey(message.conversationId),
        (current) => {
          if (!current) return current
          const firstPage = current.pages[0]
          if (firstPage.messages.some((item) => item.id === message.id)) return current
          return {
            ...current,
            pages: [
              { ...firstPage, messages: [message, ...firstPage.messages] },
              ...current.pages.slice(1),
            ],
          }
        },
      )
      void queryClient.invalidateQueries({ queryKey: conversationsQueryKey(userId) })

      if (
        message.senderId !== userId &&
        activeConversationIdRef.current === message.conversationId
      ) {
        void markConversationRead(message.conversationId)
          .then(() => {
            queryClient.setQueryData<ConversationListItem[]>(
              conversationsQueryKey(userId),
              (current) =>
                current?.map((conversation) =>
                  conversation.id === message.conversationId
                    ? { ...conversation, unreadCount: 0 }
                    : conversation,
                ),
            )
            void queryClient.invalidateQueries({
              queryKey: conversationsQueryKey(userId),
            })
          })
          .catch(() => {
            toast.error('Unable to mark message as read', {
              description: 'Please try again.',
            })
          })
      }
    }
    const handleMessageRead = (update: {
      conversationId: string
      messageIds: string[]
      readerId: string
    }) => {
      const readMessageIds = new Set(update.messageIds)
      queryClient.setQueryData<InfiniteData<MessagesPage, string | null>>(
        messagesQueryKey(update.conversationId),
        (current) => {
          if (!current) return current
          return {
            ...current,
            pages: current.pages.map((page) => ({
              ...page,
              messages: page.messages.map((message) =>
                readMessageIds.has(message.id) ? { ...message, status: 'read' } : message,
              ),
            })),
          }
        },
      )
    }
    const handlePresenceUpdate = (presence: {
      userId: string
      isOnline: boolean
      lastSeen: string | null
    }) => {
      queryClient.setQueryData<ConversationListItem[]>(
        conversationsQueryKey(userId),
        (current) =>
          current?.map((conversation) =>
            conversation.otherUser.id === presence.userId
              ? {
                  ...conversation,
                  otherUser: {
                    ...conversation.otherUser,
                    isOnline: presence.isOnline,
                    lastSeen: presence.lastSeen ?? conversation.otherUser.lastSeen,
                  },
                }
              : conversation,
          ),
      )
    }
    const handleTypingUpdate = (update: {
      conversationId: string
      userId: string
      isTyping: boolean
    }) => {
      if (
        update.userId === userId ||
        activeConversationIdRef.current !== update.conversationId
      ) {
        return
      }

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      setTypingConversationId(update.isTyping ? update.conversationId : null)
      if (update.isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          setTypingConversationId(null)
          typingTimeoutRef.current = null
        }, 4000)
      } else {
        typingTimeoutRef.current = null
      }
    }
    const handleConnect = () => {
      connectionErrorShown.current = false
      setTypingConversationId(null)
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
    const handleConnectError = (error: Error) => {
      console.error('Socket connection failed:', error.message)
      if (connectionErrorShown.current) return
      connectionErrorShown.current = true
      toast.error('Real-time connection failed', { description: error.message })
    }

    chatSocket.on('message:new', handleNewMessage)
    chatSocket.on('message:read', handleMessageRead)
    chatSocket.on('presence:update', handlePresenceUpdate)
    chatSocket.on('typing:update', handleTypingUpdate)
    chatSocket.on('connect', handleConnect)
    chatSocket.on('connect_error', handleConnectError)
    socketRef.current = chatSocket
    chatSocket.connect()

    return () => {
      chatSocket.off('message:new', handleNewMessage)
      chatSocket.off('message:read', handleMessageRead)
      chatSocket.off('presence:update', handlePresenceUpdate)
      chatSocket.off('typing:update', handleTypingUpdate)
      chatSocket.off('connect', handleConnect)
      chatSocket.off('connect_error', handleConnectError)
      chatSocket.disconnect()
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      if (socketRef.current === chatSocket) socketRef.current = null
    }
  }, [accessToken, queryClient, userId])

  useEffect(() => {
    const socket = socketRef.current
    if (!socket || !conversationId) return

    const joinRoom = () => {
      socket.emit('conversation:join', { conversationId }, (result) => {
        if (!result.success) {
          toast.error('Unable to join conversation', {
            description: result.error ?? 'Please try again.',
          })
        }
      })
    }

    socket.on('connect', joinRoom)
    if (socket.connected) joinRoom()

    return () => {
      socket.off('connect', joinRoom)
      if (socket.connected) socket.emit('conversation:leave', { conversationId })
    }
  }, [accessToken, conversationId])

  useEffect(() => {
    if (!conversationId || !userId) return

    markConversationRead(conversationId)
      .then(() => {
        queryClient.setQueryData(
          conversationsQueryKey(userId),
          (current: typeof conversationsQuery.data) =>
            current?.map((conversation) =>
              conversation.id === conversationId
                ? { ...conversation, unreadCount: 0 }
                : conversation,
            ),
        )
        void queryClient.invalidateQueries({ queryKey: conversationsQueryKey(userId) })
      })
      .catch(() => {
        toast.error('Unable to mark conversation as read', {
          description: 'Please try again.',
        })
      })
  }, [conversationId, queryClient, userId])

  async function handleSend(text: string) {
    if (!selected) return false
    try {
      const message = await sendMessage(selected.id, text)
      queryClient.setQueryData(
        messagesQueryKey(selected.id),
        (current: typeof messagesQuery.data) => {
          if (!current) return current
          const firstPage = current.pages[0]
          if (firstPage.messages.some((item) => item.id === message.id)) return current
          return {
            ...current,
            pages: [
              { ...firstPage, messages: [message, ...firstPage.messages] },
              ...current.pages.slice(1),
            ],
          }
        },
      )
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: messagesQueryKey(selected.id) }),
        queryClient.invalidateQueries({ queryKey: ['conversations', userId] }),
      ])
      return true
    } catch {
      toast.error('Unable to send message', {
        description: 'Please check your connection and try again.',
      })
      return false
    }
  }

  function handleTypingChange(isTyping: boolean) {
    if (!selected || !socketRef.current?.connected) return
    socketRef.current.emit(isTyping ? 'typing:start' : 'typing:stop', {
      conversationId: selected.id,
    })
  }

  return (
    <main className="fixed inset-0 flex h-[100dvh] w-full overflow-hidden bg-white font-sans text-gray-800">
      <Sidebar />
      {selected ? (
        <section className={`${conversationId ? 'flex' : 'hidden'} min-w-0 flex-1 flex-col bg-white`} aria-label={`Chat with ${selected.name}`}>
          <ChatHeader
            conversation={selected}
            isTyping={typingConversationId === conversationId}
          />
          <MessageList
            messages={selectedMessages}
            conversationId={selected.id}
            conversationName={selected.name}
            loading={messagesQuery.isLoading}
            error={messagesQuery.isError ? 'Unable to load messages. Please try again.' : ''}
            onRetry={() => void messagesQuery.refetch()}
            hasMore={messagesQuery.hasNextPage}
            loadingMore={messagesQuery.isFetchingNextPage}
            onLoadMore={() => void messagesQuery.fetchNextPage()}
          />
          <MessageInput key={selected.id} onSend={handleSend} onTypingChange={handleTypingChange} />
        </section>
      ) : <EmptyState />}
    </main>
  )
}
