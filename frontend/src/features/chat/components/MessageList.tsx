import { useLayoutEffect, useRef } from 'react'
import { currentUserId } from '../mock/chatData'
import type { Message } from '../types'
import MessageBubble from './MessageBubble'

type MessageListProps = {
  messages: Message[]
  conversationId: string
  conversationName: string
}

function getDateLabel(value: string) {
  const date = new Date(value)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function MessageList({
  messages,
  conversationId,
  conversationName,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const isNearBottom = useRef(true)
  const previousLength = useRef(messages.length)
  const previousConversationId = useRef<string | null>(null)

  function handleScroll() {
    const element = scrollRef.current
    if (!element) return
    isNearBottom.current =
      element.scrollHeight - element.scrollTop - element.clientHeight < 120
  }

  useLayoutEffect(() => {
    const element = scrollRef.current
    if (!element) return

    const changedConversation = previousConversationId.current !== conversationId
    const addedMessage = messages.length > previousLength.current

    if (changedConversation) {
      element.scrollTop = element.scrollHeight
      isNearBottom.current = true
    } else if (addedMessage && isNearBottom.current) {
      element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' })
    }

    previousConversationId.current = conversationId
    previousLength.current = messages.length
  }, [conversationId, messages.length])

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#faf9f8] px-4 py-5 md:px-8"
      aria-label={`Messages with ${conversationName}`}
      role="log"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-2.5">
        {messages.map((message, index) => {
          const previous = messages[index - 1]
          const showDate =
            !previous ||
            new Date(previous.createdAt).toDateString() !==
              new Date(message.createdAt).toDateString()
          const showSender = !previous || previous.senderId !== message.senderId

          return (
            <div key={message.id}>
              {showDate && (
                <div className="my-4 flex justify-center">
                  <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[10px] font-medium text-gray-500 shadow-sm">
                    {getDateLabel(message.createdAt)}
                  </span>
                </div>
              )}
              <MessageBubble
                message={message}
                isOwn={message.senderId === currentUserId}
                showSender={showSender && message.senderId !== currentUserId}
              />
            </div>
          )
        })}
        {!messages.length && (
          <p className="py-12 text-center text-sm text-gray-500">
            Start a conversation with {conversationName}.
          </p>
        )}
      </div>
    </div>
  )
}
