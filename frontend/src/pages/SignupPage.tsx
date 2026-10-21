import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { Link, useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'

import GoogleAuthButton from '@/features/auth/components/GoogleAuthButton'
import SignupForm from '@/features/auth/components/SignupForm'
import { requestEmailSignupOtp, signInWithGoogle } from '@/features/auth/api/authApi'
import type { SignupFormValues } from '@/features/auth/signupSchema'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import HomePage from '@/pages/HomePage'

type SignupPageState = {
  name?: string
  email?: string
}

function getSignupErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const responseMessage = error.response?.data?.message
    if (typeof responseMessage === 'string' && responseMessage.trim()) {
      return responseMessage
    }

    const responseError = error.response?.data?.error
    if (typeof responseError === 'string' && responseError.trim()) {
      return responseError
    }

    if (!error.response) {
      return 'Unable to connect to the server. Please try again.'
    }
  }

  return error instanceof Error ? error.message : 'Unable to create your account. Please try again.'
}

export default function SignupPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const previousSignup = (location.state as SignupPageState | null) ?? {}
  const signupMutation = useMutation({
    mutationFn: requestEmailSignupOtp,
    onSuccess: (_, values) => {
      navigate('/verify-otp', {
        state: {
          channel: 'email',
          identifier: values.email,
          name: values.name,
        },
      })
    },
  })

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') navigate('/')
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])

  async function handleSignup(values: SignupFormValues) {
    await signupMutation.mutateAsync({
      name: values.fullName.trim(),
      email: values.email.trim(),
    })
  }

  async function handleGoogleSignUp(credential: string) {
    try {
      const session = await signInWithGoogle(credential)
      setAuth(session.accessToken, session.user)
      toast.success(session.isNewUser ? 'Account created with Google' : 'Signed in with Google')
      navigate('/chats', { replace: true })
    } catch (error) {
      toast.error(getSignupErrorMessage(error))
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
          if (event.target === event.currentTarget) navigate('/')
        }}
      >
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="signup-title"
          className="my-auto w-full max-w-[440px] rounded-md bg-white px-7 py-6 shadow-xl"
        >
          <header className="mb-6 flex items-center justify-between">
            <h1 id="signup-title" className="text-2xl font-medium text-gray-700">
              Signup
            </h1>
            <Link
              to="/"
              aria-label="Close signup"
              className="rounded p-1 text-2xl leading-none text-gray-800 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-700"
            >
              ×
            </Link>
          </header>

          <SignupForm
            onSubmit={handleSignup}
            onTermsAgreementChange={setAgreedToTerms}
            initialName={previousSignup.name}
            initialEmail={previousSignup.email}
          />

          {signupMutation.isError && (
            <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {getSignupErrorMessage(signupMutation.error)}
            </p>
          )}

          <div className="my-5 flex items-center gap-3 text-sm text-gray-400">
            <span className="h-px flex-1 bg-gray-200" />
            <span>Or</span>
            <span className="h-px flex-1 bg-gray-200" />
          </div>

          <GoogleAuthButton mode="signup" onCredential={handleGoogleSignUp} />
          {/* {agreedToTerms ? (
          ) : (
            <p className="text-center text-sm text-gray-500">
              Agree to the Terms of Service and Privacy Policy above to sign up with Google.
            </p>
          )} */}

          <p className="mt-5 border-t border-gray-200 pt-4 text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-[rgb(224,53,70)] hover:underline">
              Login
            </Link>
          </p>
        </section>
      </div>
    </div>
  )
}
