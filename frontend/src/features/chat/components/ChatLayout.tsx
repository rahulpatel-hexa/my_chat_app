import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import {
  conversationsQueryKey,
  toConversation,
  useConversations,
} from '../api/conversationsApi'
import {
  markConversationRead,
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
  const userId = useAuthStore((state) => state.user?.id ?? '')
  const conversationsQuery = useConversations(userId)
  const conversations = conversationsQuery.data?.map((item) => toConversation(item, userId)) ?? []
  const selected = conversations.find((conversation) => conversation.id === conversationId)
  const queryClient = useQueryClient()
  const messagesQuery = useConversationMessages(conversationId ?? '')
  const selectedMessages = useMemo(
    () => messagesQuery.data?.pages.flatMap((page) => page.messages).reverse() ?? [],
    [messagesQuery.data],
  )
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

  return (
    <main className="fixed inset-0 flex h-[100dvh] w-full overflow-hidden bg-white font-sans text-gray-800">
      <Sidebar />
      {selected ? (
        <section className={`${conversationId ? 'flex' : 'hidden'} min-w-0 flex-1 flex-col bg-white`} aria-label={`Chat with ${selected.name}`}>
          <ChatHeader conversation={selected} />
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
          <MessageInput onSend={handleSend} />
        </section>
      ) : <EmptyState />}
    </main>
  )
}
