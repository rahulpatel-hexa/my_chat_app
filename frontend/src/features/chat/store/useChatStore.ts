import { create } from 'zustand'

type LocalChatMessage = {
  id: string
  text: string
  role: 'user' | 'assistant'
  createdAt: number
}

type ChatStore = {
  messages: LocalChatMessage[]
  sendMessage: (text: string) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],

  sendMessage: (text) => {
    const trimmedText = text.trim()

    if (!trimmedText) return

    const newMessage: LocalChatMessage = {
      id: crypto.randomUUID(),
      text: trimmedText,
      role: 'user',
      createdAt: Date.now(),
    }

    set((state) => ({
      messages: [...state.messages, newMessage],
    }))
  },

  clearMessages: () => set({ messages: [] }),
}))