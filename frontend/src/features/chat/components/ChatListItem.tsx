import { Check, CheckCheck } from 'lucide-react'
import { Link } from 'react-router'
import type { Conversation } from '../types'
import Avatar from './Avatar'

type ChatListItemProps = {
  conversation: Conversation
  selected: boolean
}

function formatTime(value: string) {
  if (!value) return ''
  const date = new Date(value)
  return date.toDateString() === new Date().toDateString()
    ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function ChatListItem({ conversation, selected }: ChatListItemProps) {
  const isOwnMessage = conversation.lastMessage.startsWith('You:')

  return (
    <Link
      to={`/chats/${conversation.id}`}
      aria-current={selected ? 'page' : undefined}
      className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 ${selected ? 'bg-rose-50/80' : ''}`}
    >
      <Avatar name={conversation.name} avatarUrl={conversation.avatarUrl} isOnline={conversation.isOnline} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold text-gray-800">{conversation.name}</span>
          <span className={`shrink-0 text-[11px] ${conversation.unreadCount ? 'text-[rgb(224,53,70)]' : 'text-gray-400'}`}>
            {formatTime(conversation.lastMessageAt)}
          </span>
        </span>
        <span className="mt-1 flex items-center gap-1.5">
          {isOwnMessage && (conversation.lastMessage.includes('Good morning')
            ? <CheckCheck aria-label="Read" className="size-3.5 text-[rgb(224,53,70)]" />
            : <Check aria-label="Sent" className="size-3.5 text-gray-400" />)}
          <span className="min-w-0 flex-1 truncate text-xs text-gray-500">
            {conversation.lastMessage.replace(/^You:\s*/, '')}
          </span>
          {conversation.unreadCount > 0 && (
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[rgb(224,53,70)] text-[10px] font-semibold text-white">
              {conversation.unreadCount}
            </span>
          )}
        </span>
      </span>
    </Link>
  )
}
