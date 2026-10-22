import { create } from 'zustand'

export type AuthUser = {
  id: string
  name: string
  email: string | null
  phone: string | null
  avatarUrl: string | null
  about: string
  description: string
}

type AuthStore = {
  accessToken: string | null
  user: AuthUser | null
  sessionStatus: 'loading' | 'authenticated' | 'unauthenticated' | 'error'
  sessionError: string | null
  setAuth: (accessToken: string, user: AuthUser) => void
  updateUser: (user: Partial<AuthUser>) => void
  clearAuth: () => void
  logout: () => void
  setUnauthenticated: () => void
  setSessionError: (message: string) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  accessToken: null,
  user: null,
  sessionStatus: 'loading',
  sessionError: null,
  setAuth: (accessToken, user) =>
    set({ accessToken, user, sessionStatus: 'authenticated', sessionError: null }),
  updateUser: (user) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...user } : null,
    })),
  clearAuth: () =>
    set({
      accessToken: null,
      user: null,
      sessionStatus: 'unauthenticated',
      sessionError: null,
    }),
  logout: () =>
    set({
      accessToken: null,
      user: null,
      sessionStatus: 'unauthenticated',
      sessionError: null,
    }),
  setUnauthenticated: () =>
    set({
      accessToken: null,
      user: null,
      sessionStatus: 'unauthenticated',
      sessionError: null,
    }),
  setSessionError: (message) =>
    set({
      accessToken: null,
      user: null,
      sessionStatus: 'error',
      sessionError: message,
    }),
}))
