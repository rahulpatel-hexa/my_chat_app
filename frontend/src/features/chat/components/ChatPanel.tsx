import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { useChatStore } from '../store/useChatStore'

export default function ChatPanel() {
  const user = useAuthStore((state) => state.user)
  const messages = useChatStore((state) => state.messages)
  const sendMessage = useChatStore((state) => state.sendMessage)
  const clearMessages = useChatStore((state) => state.clearMessages)
  const [draft, setDraft] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    sendMessage(draft)
    setDraft('')
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 p-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="size-11 rounded-full object-cover"
            />
          ) : user ? (
            <div
              aria-hidden="true"
              className="grid size-11 place-items-center rounded-full bg-[rgb(224,53,70)] font-semibold text-white"
            >
              {user.name.trim().slice(0, 1).toUpperCase()}
            </div>
          ) : null}
          <div>
            <h1 className="text-2xl font-bold">{user?.name ?? 'Chat'}</h1>
            {user?.email && <p className="text-sm text-gray-500">{user.email}</p>}
            {user?.about && <p className="text-xs text-gray-500">{user.about}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-blue-700 underline">
            Sign in
          </Link>
          <button
            type="button"
            onClick={clearMessages}
            className="rounded border px-3 py-2"
          >
            Clear chat
          </button>
        </div>
      </header>

      <ul className="flex flex-1 flex-col gap-3">
        {messages.length === 0 && (
          <li className="text-gray-500">No messages yet. Send one to begin.</li>
        )}

        {messages.map((message) => (
          <li
            key={message.id}
            className="w-fit max-w-[80%] rounded-lg bg-blue-100 px-4 py-2"
          >
            {message.text}
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Write a message"
          aria-label="Write a message"
          className="min-w-0 flex-1 rounded border px-3 py-2"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </main>
  )
}