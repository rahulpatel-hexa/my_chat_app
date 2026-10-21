import type { Message } from '../types'

type MessageBubbleProps = {
  message: Message
  isOwn: boolean
  showSender: boolean
}

function getStatusLabel(status: Message['status']) {
  if (status === 'read') return 'Read'
  if (status === 'delivered') return 'Delivered'
  return 'Sent'
}

export default function MessageBubble({
  message,
  isOwn,
  showSender,
}: MessageBubbleProps) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
  const ticks = message.status === 'sent' ? '✓' : '✓✓'

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm ${
          isOwn
            ? 'rounded-br-md bg-[rgb(224,53,70)] text-white'
            : 'rounded-bl-md border border-gray-100 bg-gray-100 text-gray-800'
        }`}
      >
        {showSender && (
          <p className="mb-1 text-[11px] font-semibold text-[rgb(224,53,70)]">
            Friend
          </p>
        )}
        <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-[13px] leading-5">
          {message.text}
        </p>
        <span
          className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
            isOwn ? 'text-rose-100' : 'text-gray-500'
          }`}
        >
          {time}
          {isOwn && (
            <span
              aria-label={getStatusLabel(message.status)}
              title={getStatusLabel(message.status)}
              className={`font-semibold tracking-[-0.2em] ${
                message.status === 'read'
                  ? 'text-sky-200'
                  : message.status === 'delivered'
                    ? 'text-white/80'
                    : 'text-rose-100'
              }`}
            >
              {ticks}
            </span>
          )}
        </span>
      </div>
    </div>
  )
}
