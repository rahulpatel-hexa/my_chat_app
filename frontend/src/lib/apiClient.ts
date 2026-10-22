import axios from 'axios'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import type { AuthUser } from '@/features/auth/store/useAuthStore'

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    authRetry?: boolean
  }
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

type RefreshedSession = {
  accessToken: string
  user: AuthUser
}

let refreshRequest: Promise<RefreshedSession> | null = null

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401 || !error.config) {
      return Promise.reject(error)
    }

    const request = error.config
    if (
      request.authRetry ||
      request.url?.includes('/auth/') ||
      !useAuthStore.getState().accessToken
    ) {
      return Promise.reject(error)
    }

    request.authRetry = true
    try {
      if (!refreshRequest) {
        refreshRequest = apiClient
          .post<RefreshedSession>('/auth/refresh')
          .then((response) => response.data)
          .finally(() => {
            refreshRequest = null
          })
      }

      const session = await refreshRequest
      useAuthStore.getState().setAuth(session.accessToken, session.user)
      request.headers.Authorization = `Bearer ${session.accessToken}`
      return apiClient.request(request)
    } catch (refreshError) {
      useAuthStore.getState().setUnauthenticated()
      return Promise.reject(refreshError)
    }
  },
)

export default apiClient
