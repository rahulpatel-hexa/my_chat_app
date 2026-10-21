import { MessageCircleMore } from 'lucide-react'

export default function EmptyState() {
  return (
    <div className="hidden flex-1 flex-col items-center justify-center bg-[#faf9f8] px-6 text-center md:flex">
      <div className="mb-5 grid size-20 place-items-center rounded-3xl bg-rose-50 text-[rgb(224,53,70)]"><MessageCircleMore className="size-9 stroke-[1.5]" /></div>
      <h1 className="text-xl font-semibold tracking-tight text-gray-800">Your conversations, all in one place</h1>
      <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">Select a chat from the sidebar to pick up where you left off, or start a new conversation.</p>
      <span className="mt-6 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs text-gray-500">Select a conversation to get started</span>
    </div>
  )
}
