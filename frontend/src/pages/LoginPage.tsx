import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'
import GoogleAuthButton from '@/features/auth/components/GoogleAuthButton'
import { signInWithGoogle } from '@/features/auth/api/authApi'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import LoginForm from '@/features/auth/components/LoginForm'
import type { LoginFormValues } from '@/features/auth/loginSchema'
import HomePage from '@/pages/HomePage'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((state) => state.setAuth)
  const initialPhone = (location.state as { phone?: string } | null)?.phone

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        navigate('/')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])

  function handleLogin(values: LoginFormValues) {
    navigate('/verify-otp', { state: { phone: values.phone } })
  }

  async function handleGoogleSignIn(credential: string) {
    try {
      const session = await signInWithGoogle(credential)
      setAuth(session.accessToken, session.user)
      toast.success('Signed in with Google')
      navigate('/chats', { replace: true })
    } catch (error) {
      const message =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof error.response === 'object' &&
        error.response !== null &&
        'data' in error.response &&
        typeof error.response.data === 'object' &&
        error.response.data !== null &&
        'message' in error.response.data &&
        typeof error.response.data.message === 'string'
          ? error.response.data.message
          : 'Unable to sign in with Google. Please try again.'
      toast.error(message)
    }
  }

  return (
    <div className="relative min-h-screen">
      <div aria-hidden="true" inert>
        <HomePage />
      </div>

      <div
        className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/85 p-4"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            navigate('/')
          }
        }}
      >
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-title"
          className="my-auto min-h-[360px] w-full max-w-[440px] rounded-md bg-white px-7 py-6 shadow-xl"
        >
          <header className="mb-6 flex items-center justify-between">
            <h1 id="login-title" className="text-2xl font-medium text-gray-700">
              Login
            </h1>
            <Link
              to="/"
              aria-label="Close login"
              className="rounded p-1 text-2xl leading-none text-gray-800 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-700"
            >
              ×
            </Link>
          </header>

          <LoginForm onSubmit={handleLogin} initialPhone={initialPhone} />

          <div className="my-5 flex items-center gap-3 text-sm text-gray-400">
            <span className="h-px flex-1 bg-gray-200" />
            <span>Or</span>
            <span className="h-px flex-1 bg-gray-200" />
          </div>

          <GoogleAuthButton mode="signin" onCredential={handleGoogleSignIn} />

          <p className="border-t border-gray-200 pt-4 text-sm text-gray-500">
            New here?{' '}
            <Link to="/signup" className="text-[rgb(224,53,70)] hover:underline">
              Create an account
            </Link>
          </p>
        </section>
      </div>
    </div>
  )
}
