import { LogOut, MessageSquarePlus, MoreVertical, Search, UserRound } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { logoutAuthSession } from '@/features/auth/api/authApi'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import {
  conversationsQueryKey,
  toConversation,
  type ConversationListItem,
  useConversations,
} from '../api/conversationsApi'
import Avatar from './Avatar'
import ChatListItem from './ChatListItem'
import NewChatDialog from './NewChatDialog'

function ChatListSkeleton() {
  return (
    <div aria-label="Loading chats" role="status" className="space-y-1 px-4 py-2">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex animate-pulse items-center gap-3 py-3">
          <span className="size-11 shrink-0 rounded-full bg-gray-200" />
          <span className="min-w-0 flex-1 space-y-2">
            <span className="block h-3 w-2/5 rounded bg-gray-200" />
            <span className="block h-3 w-4/5 rounded bg-gray-100" />
          </span>
        </div>
      ))}
      <span className="sr-only">Loading conversations…</span>
    </div>
  )
}

export default function Sidebar() {
  const { conversationId } = useParams()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const userId = user?.id ?? ''
  const conversationsQuery = useConversations(userId)
  const chatConversations = useMemo(
    () => conversationsQuery.data?.map((item) => toConversation(item, userId)) ?? [],
    [conversationsQuery.data, userId],
  )
  const loading = conversationsQuery.isLoading
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [newChatOpen, setNewChatOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const filtered = useMemo(
    () => chatConversations.filter((item) => item.name.toLowerCase().includes(query.trim().toLowerCase())),
    [chatConversations, query],
  )

  function handleNewChat() {
    setNewChatOpen(true)
  }

  const closeNewChat = useCallback(() => setNewChatOpen(false), [])

  function handleConversationCreated(conversation: ConversationListItem) {
    queryClient.setQueryData<ConversationListItem[]>(conversationsQueryKey(userId), (current) => [
      conversation,
      ...(current ?? []).filter((item) => item.id !== conversation.id),
    ])
    closeNewChat()
    navigate(`/chats/${conversation.id}`)
  }

  async function handleLogout() {
    try {
      await logoutAuthSession()
    } catch {
      toast.error('Unable to log out', {
        description: 'The server could not end your session. Please try again.',
      })
      return
    }
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className={`${conversationId ? 'hidden md:flex' : 'flex'} h-full w-full shrink-0 flex-col border-r border-gray-200 bg-white md:w-[360px]`}>
      <header className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={user?.name || 'RS'} avatarUrl={user?.avatarUrl ?? undefined} />
          <p className="truncate text-base font-semibold tracking-tight text-gray-900">{user?.name}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={handleNewChat}
            aria-label="New chat"
            title="New chat"
            className="grid size-9 place-items-center rounded-full text-gray-500 transition-colors hover:bg-rose-50 hover:text-[rgb(224,53,70)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(224,53,70)]"
          >
            <MessageSquarePlus className="size-[18px]" />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Open account menu"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="grid size-9 place-items-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
            >
              <MoreVertical className="size-[18px]" />
            </button>
            {menuOpen && (
              <div
                role="menu"
                aria-label="Account menu"
                className="absolute right-0 top-11 z-20 w-44 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg"
              >
                <Link
                  to="/profile"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <UserRound className="size-4 text-gray-400" />
                  Profile
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  <LogOut className="size-4 text-gray-400" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="px-4 pb-4">
        <label className="flex h-10 items-center gap-2.5 rounded-lg bg-gray-100 px-3 text-gray-400 focus-within:ring-2 focus-within:ring-rose-200">
          <Search aria-hidden="true" className="size-4 shrink-0" />
          <input ref={searchRef} type="search" value={query} onChange={(event) => setQuery(event.currentTarget.value)} placeholder="Search conversations" aria-label="Search conversations" className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400" />
        </label>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between px-5 pb-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">Recent chats</h2>
          {!loading && <span className="text-xs text-gray-400">{filtered.length}</span>}
        </div>
        <nav aria-label="Conversations" className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {loading ? (
            <ChatListSkeleton />
          ) : conversationsQuery.isError ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-rose-600">Unable to load conversations.</p>
              <button
                type="button"
                onClick={() => void conversationsQuery.refetch()}
                className="mt-2 text-sm font-medium text-gray-700 underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((conversation) => (
              <ChatListItem key={conversation.id} conversation={conversation} selected={conversation.id === conversationId} />
            ))
          ) : (
            <p className="px-5 py-8 text-center text-sm text-gray-500">
              {chatConversations.length === 0 ? 'No chats yet' : 'No conversations found.'}
            </p>
          )}
        </nav>
      </div>
      {newChatOpen && (
        <NewChatDialog
          onClose={closeNewChat}
          onConversationCreated={handleConversationCreated}
        />
      )}
    </aside>
  )
}
