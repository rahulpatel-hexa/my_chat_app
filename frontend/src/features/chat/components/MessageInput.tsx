import { Send, Smile } from 'lucide-react'
import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react'

export default function MessageInput({
  onSend,
}: {
  onSend: (text: string) => Promise<boolean>
}) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function sendMessage() {
    const message = text.trim()
    if (!message || sending) return
    setSending(true)
    try {
      const sent = await onSend(message)
      if (sent) {
        setText('')
        if (textareaRef.current) {
          textareaRef.current.style.height = '24px'
        }
      }
    } finally {
      setSending(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    sendMessage()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  function handleChange(value: string) {
    setText(value)
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = '24px'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex shrink-0 items-end gap-2 border-t border-gray-200 bg-white px-3 py-3 md:gap-3 md:px-6 md:py-4"
    >
      <label className="flex min-h-11 min-w-0 flex-1 items-end gap-2 rounded-xl bg-gray-100 px-3 py-2 focus-within:ring-2 focus-within:ring-rose-200 md:px-4">
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(event) => handleChange(event.currentTarget.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a message..."
          aria-label="Write a message"
          className="max-h-[120px] min-h-6 min-w-0 flex-1 resize-none overflow-y-auto bg-transparent text-sm leading-6 text-gray-800 outline-none placeholder:text-gray-400"
        />
        <button
          type="button"
          aria-label="Add emoji (coming soon)"
          title="Emoji picker coming soon"
          className="grid size-8 shrink-0 place-items-center rounded-full text-gray-400 hover:text-gray-600"
        >
          <Smile className="size-[18px]" />
        </button>
      </label>
      <button
        type="submit"
        disabled={!text.trim() || sending}
        aria-label="Send message"
        className="grid size-11 shrink-0 place-items-center rounded-xl bg-[rgb(224,53,70)] text-white transition-colors hover:bg-[rgb(196,38,55)] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
      >
        <Send className="size-[18px]" />
      </button>
    </form>
  )
}
