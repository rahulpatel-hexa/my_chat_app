import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/apiClient'
import type { Conversation } from '../types'

export type ConversationListItem = {
  id: string
  otherUser: {
    id: string
    name: string
    avatarUrl: string | null
    isOnline: boolean
    lastSeen: string | null
  }
  lastMessage: {
    text: string
    senderId: string
    createdAt: string
  } | null
  unreadCount: number
}

export const conversationsQueryKey = (userId: string) => ['conversations', userId] as const

export async function getConversations() {
  const response = await apiClient.get<{
    success: boolean
    conversations: ConversationListItem[]
  }>('/conversations')
  return response.data.conversations
}

export async function createDirectConversation(userId: string) {
  const response = await apiClient.post<{
    success: boolean
    conversation: ConversationListItem
  }>('/conversations', { userId })
  return response.data.conversation
}

export function toConversation(item: ConversationListItem, myId: string): Conversation {
  const lastMessage = item.lastMessage
  return {
    id: item.id,
    name: item.otherUser.name,
    avatarUrl: item.otherUser.avatarUrl ?? undefined,
    lastMessage: lastMessage
      ? `${lastMessage.senderId === myId ? 'You: ' : ''}${lastMessage.text}`
      : 'Start a conversation',
    lastMessageAt: lastMessage?.createdAt ?? '',
    lastSeen: item.otherUser.lastSeen,
    unreadCount: item.unreadCount,
    isOnline: item.otherUser.isOnline,
  }
}

export function useConversations(userId: string) {
  return useQuery({
    queryKey: conversationsQueryKey(userId),
    queryFn: getConversations,
    enabled: Boolean(userId),
  })
}
