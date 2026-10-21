import { useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { conversations, currentUserId, messages as mockMessages } from '../mock/chatData'
import type { Message } from '../types'
import ChatHeader from './ChatHeader'
import EmptyState from './EmptyState'
import MessageInput from './MessageInput'
import MessageList from './MessageList'
import Sidebar from './Sidebar'

export default function ChatLayout() {
  const { conversationId } = useParams()
  const [messages, setMessages] = useState(mockMessages)
  const selected = conversations.find((conversation) => conversation.id === conversationId)
  const selectedMessages = useMemo(
    () => messages.filter((message) => message.conversationId === conversationId),
    [conversationId, messages],
  )

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
      <Sidebar />
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
