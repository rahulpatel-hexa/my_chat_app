export type Conversation = {
  id: string
  name: string
  avatarUrl?: string
  lastMessage: string
  lastMessageAt: string
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
}
