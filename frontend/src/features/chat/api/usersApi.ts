import apiClient from '@/lib/apiClient'

export type UserSearchResult = {
  id: string
  name: string
  avatarUrl: string | null
  about: string
  isOnline: boolean
}

export async function searchUsers(query: string, signal?: AbortSignal) {
  const response = await apiClient.get<{ success: boolean; users: UserSearchResult[] }>(
    '/users/search',
    { params: { q: query }, signal },
  )
  return response.data.users
}
