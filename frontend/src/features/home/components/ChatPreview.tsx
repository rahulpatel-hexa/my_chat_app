import { useEffect, useRef, useState, type FormEvent } from "react"
import { Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Message = {
  id: number
  from: "me" | "them"
  author: string
  text: string
}

const INITIAL_MESSAGES: Message[] = [
  { id: 1, from: "them", author: "John", text: "Did the new onboarding flow ship?" },
  { id: 2, from: "me", author: "You", text: "Yes, it went out this morning." },
  { id: 3, from: "them", author: "John", text: "Great. Try typing a message below." },
]

const REPLIES = [
  "That works for me.",
  "Sending the file over now.",
  "Let's pick this up in the design channel.",
  "Got it, thanks.",
]

export function ChatPreview() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [draft, setDraft] = useState("")
  const [typing, setTyping] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const nextId = useRef(INITIAL_MESSAGES.length + 1)
  const replyIndex = useRef(0)
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const element = scrollRef.current
    if (element) element.scrollTop = element.scrollHeight
  }, [messages, typing])

  useEffect(() => {
    return () => {
      if (timeout.current) clearTimeout(timeout.current)
    }
  }, [])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = draft.trim()
    if (!text) return

    setMessages((previous) => [
      ...previous,
      { id: nextId.current++, from: "me", author: "You", text },
    ])
    setDraft("")
    setTyping(true)

    if (timeout.current) clearTimeout(timeout.current)
    timeout.current = setTimeout(() => {
      const reply = REPLIES[replyIndex.current % REPLIES.length]
      replyIndex.current += 1
      setTyping(false)
      setMessages((previous) => [
        ...previous,
        { id: nextId.current++, from: "them", author: "John", text: reply },
      ])
    }, 1100)
  }

  return (
    <div
      className="flex h-[26rem] w-full max-w-md flex-col overflow-hidden rounded-2xl border bg-card shadow-sm"
      role="group"
      aria-label="Live chat preview"
    >
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <div
          className="grid size-8 place-items-center rounded-full bg-primary/10 text-sm font-medium text-primary"
          aria-hidden="true"
        >
          J
        </div>
        <div className="leading-tight">
          <p className="text-sm font-medium">John</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            Online
          </p>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-4"
        role="log"
        aria-live="polite"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.from === "me"
                ? "max-w-[80%] self-end rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground"
                : "max-w-[80%] self-start rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2 text-sm"
            }
          >
            <span className="sr-only">{message.author}: </span>
            {message.text}
          </div>
        ))}

        {typing && (
          <div
            className="self-start rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2 text-sm text-muted-foreground motion-safe:animate-pulse"
            aria-label="John is typing"
          >
            John is typing…
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t p-3">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Write a message"
          aria-label="Message"
          autoComplete="off"
        />
        <Button
          type="submit"
          size="icon"
          aria-label="Send message"
          disabled={!draft.trim()}
        >
          <Send />
        </Button>
      </form>
    </div>
  )
}
