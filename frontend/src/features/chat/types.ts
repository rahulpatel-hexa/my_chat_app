export type Conversation = {
  id: string
  name: string
  avatarUrl?: string
  lastMessage: string
  lastMessageAt: string
  lastSeen?: string | null
  unreadCount: number
  isOnline: boolean
}

export type Message = {
  id: string
  conversationId: string
  senderId: string
  text: string
  createdAt: string
  status: 'sent' | 'delivered' | 'read'
  type?: 'text' | 'image' | 'file' | 'audio'
  updatedAt?: string
}
