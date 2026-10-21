import apiClient from '@/lib/apiClient'
import type { AuthUser } from '@/features/auth/store/useAuthStore'

type EmailSignupPayload = {
  name: string
  email: string
}

type VerifyEmailOtpPayload = {
  email: string
  otp: string
}

export type VerifyEmailOtpResponse = {
  success: boolean
  accessToken: string
  isNewUser?: boolean
  user: AuthUser
}

type AuthSessionResponse = Omit<VerifyEmailOtpResponse, 'isNewUser'>

let refreshRequest: Promise<AuthSessionResponse> | null = null

export async function requestEmailSignupOtp(payload: EmailSignupPayload) {
  await apiClient.post('/auth/email/signup', payload)
}

export async function verifyEmailSignupOtp(payload: VerifyEmailOtpPayload) {
  const response = await apiClient.post<VerifyEmailOtpResponse>(
    '/auth/email/verify-otp',
    payload,
  )
  return response.data
}

export async function signInWithGoogle(credential: string) {
  const response = await apiClient.post<VerifyEmailOtpResponse>('/auth/google', {
    credential,
  })
  return response.data
}

export function refreshAuthSession() {
  if (!refreshRequest) {
    refreshRequest = apiClient
      .post<AuthSessionResponse>('/auth/refresh')
      .then((response) => response.data)
      .finally(() => {
        refreshRequest = null
      })
  }
  return refreshRequest
}

export async function logoutAuthSession() {
  await apiClient.post('/auth/logout')
}
