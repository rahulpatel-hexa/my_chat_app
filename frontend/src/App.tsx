import { useEffect, useRef } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router'
import axios from 'axios'
import AddPhoneModal from '@/features/auth/components/AddPhoneModal'
import ProtectedRoute from '@/features/auth/components/ProtectedRoute'
import GuestOnlyRoute from '@/features/auth/components/GuestOnlyRoute'
import { refreshAuthSession } from '@/features/auth/api/authApi'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import PrivacyPage from '@/pages/PrivacyPage'
import LoginPage from '@/pages/LoginPage'
import OtpVerificationPage from '@/pages/OtpVerificationPage'
import ProfileSetupPage from '@/pages/ProfileSetupPage'
import SignupPage from '@/pages/SignupPage'
import TermsPage from '@/pages/TermsPage'
import NotFound from './NotFound'
import ChatsPage from '@/features/chat/pages/ChatsPage'
import HomePage from './pages/HomePage'

function AddPhoneRoute() {
  const navigate = useNavigate()

  return (
    <AddPhoneModal
      onSkip={() => undefined}
      onOtpSent={(phone) => navigate('/verify-otp', { state: { phone } })}
    />
  )
}

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const hasOpenedLogin = useRef(false)
  const setAuth = useAuthStore((state) => state.setAuth)
  const setUnauthenticated = useAuthStore((state) => state.setUnauthenticated)
  const setSessionError = useAuthStore((state) => state.setSessionError)

  useEffect(() => {
    let active = true

    refreshAuthSession()
      .then((session) => {
        if (active) setAuth(session.accessToken, session.user)
      })
      .catch((error: unknown) => {
        if (!active) return
        if (axios.isAxiosError(error) && error.response?.status !== undefined && error.response.status !== 401) {
          setSessionError(
            typeof error.response.data?.message === 'string'
              ? error.response.data.message
              : 'Unable to restore your session. Please try again.',
          )
          return
        }
        if (axios.isAxiosError(error) && !error.response) {
          setSessionError('Unable to connect to the server to restore your session.')
          return
        }
        setUnauthenticated()
      })

    return () => {
      active = false
    }
  }, [setAuth, setSessionError, setUnauthenticated])

  useEffect(() => {
    if (location.pathname === '/login') {
      hasOpenedLogin.current = true
      return
    }

    if (location.pathname !== '/' || hasOpenedLogin.current) return

    const timeoutId = window.setTimeout(() => {
      hasOpenedLogin.current = true
      navigate('/login')
    }, 2500)

    return () => window.clearTimeout(timeoutId)
  }, [location.pathname, navigate])

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route element={<GuestOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      <Route path="/verify-otp" element={<OtpVerificationPage />} />
      
      <Route element={<ProtectedRoute />}>
        <Route path="/profile-setup" element={<ProfileSetupPage />} />
        <Route path="/add-phone" element={<AddPhoneRoute />} />
        <Route path="/chats" element={<ChatsPage />} />
        <Route path="/chats/:conversationId" element={<ChatsPage />} />
      </Route>
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
