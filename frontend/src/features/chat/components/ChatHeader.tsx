import { ArrowLeft, MoreHorizontal, Search } from 'lucide-react'
import { Link } from 'react-router'
import type { Conversation } from '../types'
import Avatar from './Avatar'

function formatLastSeen(value: string) {
  const date = new Date(value)
  const today = new Date()
  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

  if (date.toDateString() === today.toDateString()) return `Last seen today at ${time}`
  return `Last seen ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}`
}

export default function ChatHeader({ conversation }: { conversation: Conversation }) {
  return (
    <header className="flex h-[76px] shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          to="/chats"
          aria-label="Back to conversations"
          className="grid size-9 shrink-0 place-items-center rounded-full text-gray-600 hover:bg-gray-100 md:hidden"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <Avatar name={conversation.name} avatarUrl={conversation.avatarUrl} isOnline={conversation.isOnline} />
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold text-gray-900">{conversation.name}</h1>
          <p className="mt-0.5 text-xs text-gray-500">
            {conversation.isOnline ? 'online' : formatLastSeen(conversation.lastMessageAt)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Search in conversation"
          className="grid size-9 place-items-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-[rgb(224,53,70)]"
        >
          <Search className="size-[18px]" />
        </button>
        <button
          type="button"
          aria-label="More conversation options"
          className="grid size-9 place-items-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-[rgb(224,53,70)]"
        >
          <MoreHorizontal className="size-[18px]" />
        </button>
      </div>
    </header>
  )
}
