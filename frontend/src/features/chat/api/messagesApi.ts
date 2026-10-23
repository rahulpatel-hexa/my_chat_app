import { useInfiniteQuery } from '@tanstack/react-query'
import apiClient from '@/lib/apiClient'
import type { Message } from '../types'

export type ConversationMessage = Message & {
  type: 'text' | 'image' | 'file' | 'audio'
  updatedAt: string
}

type MessagesPage = {
  messages: ConversationMessage[]
  nextCursor: string | null
}

export const messagesQueryKey = (conversationId: string) =>
  ['conversations', conversationId, 'messages'] as const

export async function getMessages(
  conversationId: string,
  cursor: string | null,
  signal?: AbortSignal,
) {
  const response = await apiClient.get<{ success: boolean } & MessagesPage>(
    `/conversations/${conversationId}/messages`,
    {
      params: { cursor: cursor ?? undefined, limit: 30 },
      signal,
    },
  )
  return response.data
}

export async function sendMessage(conversationId: string, text: string) {
  const response = await apiClient.post<{ success: boolean; message: ConversationMessage }>(
    `/conversations/${conversationId}/messages`,
    { text },
  )
  return response.data.message
}

export async function markConversationRead(conversationId: string) {
  await apiClient.patch(`/conversations/${conversationId}/read`)
}

export function useConversationMessages(conversationId: string) {
  return useInfiniteQuery({
    queryKey: messagesQueryKey(conversationId),
    queryFn: ({ pageParam, signal }) => getMessages(conversationId, pageParam, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: Boolean(conversationId),
  })
}
