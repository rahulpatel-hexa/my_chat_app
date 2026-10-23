import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import type { UserSearchResult } from '../api/usersApi'
import { conversations as mockConversations, currentUserId, messages as mockMessages } from '../mock/chatData'
import type { Conversation, Message } from '../types'
import ChatHeader from './ChatHeader'
import EmptyState from './EmptyState'
import MessageInput from './MessageInput'
import MessageList from './MessageList'
import Sidebar from './Sidebar'

export default function ChatLayout() {
  const { conversationId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const pendingNewChatUser = (location.state as { newChatUser?: UserSearchResult } | null)?.newChatUser
  const [conversations, setConversations] = useState(() => (
    pendingNewChatUser
      ? [createConversation(pendingNewChatUser), ...mockConversations]
      : mockConversations
  ))
  const [messages, setMessages] = useState(mockMessages)
  const selected = conversations.find((conversation) => conversation.id === conversationId)
  const selectedMessages = useMemo(
    () => messages.filter((message) => message.conversationId === conversationId),
    [conversationId, messages],
  )

  useEffect(() => {
    if (!pendingNewChatUser) return
    navigate(`/chats/${pendingNewChatUser.id}`, { replace: true, state: null })
  }, [navigate, pendingNewChatUser])

  function handleSelectUser(user: UserSearchResult) {
    setConversations((current) => {
      if (current.some((conversation) => conversation.id === user.id)) return current
      return [createConversation(user), ...current]
    })
    navigate(`/chats/${user.id}`)
  }

  function handleSend(text: string) {
    if (!selected) return
    const message: Message = {
      id: `local-${crypto.randomUUID()}`,
      conversationId: selected.id,
      senderId: currentUserId,
      text,
      createdAt: new Date().toISOString(),
      status: 'sent',
    }
    setMessages((current) => [...current, message])
  }

  return (
    <main className="fixed inset-0 flex h-[100dvh] w-full overflow-hidden bg-white font-sans text-gray-800">
      <Sidebar conversations={conversations} onSelectUser={handleSelectUser} />
      {selected ? (
        <section className={`${conversationId ? 'flex' : 'hidden'} min-w-0 flex-1 flex-col bg-white`} aria-label={`Chat with ${selected.name}`}>
          <ChatHeader conversation={selected} />
          <MessageList
            messages={selectedMessages}
            conversationId={selected.id}
            conversationName={selected.name}
          />
          <MessageInput onSend={handleSend} />
        </section>
      ) : <EmptyState />}
    </main>
  )
}

function createConversation(user: UserSearchResult): Conversation {
  return {
    id: user.id,
    name: user.name,
    avatarUrl: user.avatarUrl ?? undefined,
    lastMessage: 'Start a conversation',
    lastMessageAt: new Date().toISOString(),
    unreadCount: 0,
    isOnline: user.isOnline,
  }
}
