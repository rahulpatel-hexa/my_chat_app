import axios from 'axios'
import { MessageCircle, Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createDirectConversation, type ConversationListItem } from '../api/conversationsApi'
import { searchUsers, type UserSearchResult } from '../api/usersApi'
import Avatar from './Avatar'

type NewChatDialogProps = {
  onClose: () => void
  onConversationCreated: (conversation: ConversationListItem) => void
}

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? 'Unable to search for users. Please try again.'
  }
  return 'Unable to search for users. Please try again.'
}

export default function NewChatDialog({ onClose, onConversationCreated }: NewChatDialogProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ query: string; users: UserSearchResult[] } | null>(null)
  const [searchError, setSearchError] = useState<{ query: string; message: string } | null>(null)
  const [creatingUserId, setCreatingUserId] = useState<string | null>(null)
  const [createError, setCreateError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  useEffect(() => {
    const searchTerm = query.trim()
    if (!searchTerm) return

    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => {
      searchUsers(searchTerm, controller.signal)
        .then((users) => setResults({ query: searchTerm, users }))
        .catch((searchError: unknown) => {
          if (!controller.signal.aborted) {
            setSearchError({ query: searchTerm, message: getErrorMessage(searchError) })
          }
        })
    }, 250)

    return () => {
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [query])

  const searchTerm = query.trim()
  const currentResults = results?.query === searchTerm ? results.users : []
  const currentError = searchError?.query === searchTerm ? searchError.message : ''
  const loading = Boolean(searchTerm) && !currentError && results?.query !== searchTerm

  async function handleSelectUser(user: UserSearchResult) {
    setCreatingUserId(user.id)
    setCreateError('')
    try {
      const conversation = await createDirectConversation(user.id)
      onConversationCreated(conversation)
    } catch (error: unknown) {
      setCreateError(getErrorMessage(error))
      setCreatingUserId(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-chat-title"
        className="flex max-h-[min(640px,calc(100dvh-2rem))] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        <header className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-rose-50 text-[rgb(224,53,70)]">
              <MessageCircle aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h2 id="new-chat-title" className="text-base font-semibold text-gray-900">New chat</h2>
              <p className="text-xs text-gray-500">Find someone to start a conversation</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close new chat"
            className="grid size-9 place-items-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </header>

        <div className="p-4">
          <label className="flex h-11 items-center gap-2.5 rounded-lg bg-gray-100 px-3 text-gray-400 focus-within:ring-2 focus-within:ring-rose-200">
            <Search aria-hidden="true" className="size-4 shrink-0" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              autoComplete="off"
              onChange={(event) => {
                setQuery(event.currentTarget.value)
                setCreateError('')
              }}
              placeholder="Search by name, email, or phone"
              aria-label="Search by name, email, or phone"
              className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
            />
          </label>
        </div>

        <div className="min-h-36 flex-1 overflow-y-auto border-t border-gray-100 px-2 py-2">
          {createError && <p role="alert" className="px-3 py-3 text-center text-sm text-rose-600">{createError}</p>}
          {loading ? (
            <p role="status" className="px-3 py-8 text-center text-sm text-gray-500">Searching…</p>
          ) : currentError ? (
            <p role="alert" className="px-3 py-8 text-center text-sm text-rose-600">{currentError}</p>
          ) : currentResults.length > 0 ? (
            <ul aria-label="Search results">
              {currentResults.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    onClick={() => void handleSelectUser(user)}
                    disabled={creatingUserId !== null}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[rgb(224,53,70)]"
                  >
                    <Avatar name={user.name} avatarUrl={user.avatarUrl ?? undefined} isOnline={user.isOnline} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-gray-800">{user.name}</span>
                      <span className="mt-0.5 block truncate text-xs text-gray-500">
                        {creatingUserId === user.id ? 'Opening conversation…' : user.about || 'No status available'}
                      </span>
                    </span>
                    {user.isOnline && <span className="text-xs text-emerald-600">Online</span>}
                  </button>
                </li>
              ))}
            </ul>
          ) : searchTerm ? (
            <p className="px-3 py-8 text-center text-sm text-gray-500">No users found.</p>
          ) : (
            <p className="px-3 py-8 text-center text-sm text-gray-500">Start typing to find people.</p>
          )}
        </div>
      </section>
    </div>
  )
}
