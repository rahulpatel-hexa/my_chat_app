import { useLayoutEffect, useRef } from 'react'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import type { Message } from '../types'
import MessageBubble from './MessageBubble'

type MessageListProps = {
  messages: Message[]
  conversationId: string
  conversationName: string
  loading?: boolean
  error?: string
  onRetry?: () => void
  hasMore?: boolean
  loadingMore?: boolean
  onLoadMore?: () => void
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
  loading = false,
  error = '',
  onRetry,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}: MessageListProps) {
  const currentUserId = useAuthStore((state) => state.user?.id)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isNearBottom = useRef(true)
  const previousLength = useRef(messages.length)
  const previousConversationId = useRef<string | null>(null)
  const previousLoadingMore = useRef(loadingMore)
  const previousScrollHeight = useRef<number | null>(null)

  function loadMoreMessages() {
    previousScrollHeight.current = scrollRef.current?.scrollHeight ?? null
    onLoadMore?.()
  }

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
    } else if (previousLoadingMore.current && !loadingMore && previousScrollHeight.current !== null) {
      element.scrollTop += element.scrollHeight - previousScrollHeight.current
      previousScrollHeight.current = null
    } else if (addedMessage && isNearBottom.current) {
      element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' })
    }

    previousConversationId.current = conversationId
    previousLength.current = messages.length
    previousLoadingMore.current = loadingMore
  }, [conversationId, loadingMore, messages.length])

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
        {hasMore && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={loadMoreMessages}
              disabled={loadingMore}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50 disabled:cursor-wait disabled:opacity-60"
            >
              {loadingMore ? 'Loading older messages…' : 'Load older messages'}
            </button>
          </div>
        )}
        {loading && !messages.length && (
          <p role="status" className="py-12 text-center text-sm text-gray-500">Loading messages…</p>
        )}
        {error && (
          <div role="alert" className="py-8 text-center">
            <p className="text-sm text-rose-600">{error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-2 text-sm font-medium text-gray-700 underline underline-offset-2"
              >
                Try again
              </button>
            )}
          </div>
        )}
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
        {!loading && !error && !messages.length && (
          <p className="py-12 text-center text-sm text-gray-500">
            Start a conversation with {conversationName}.
          </p>
        )}
      </div>
    </div>
  )
}
