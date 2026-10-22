import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { Link, useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'
import {
  resendOtp,
  verifyEmailSignupOtp,
  verifyPhoneLoginOtp,
} from '@/features/auth/api/authApi'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import HomePage from '@/pages/HomePage'

type OtpPageState = {
  phone?: string
  channel?: 'phone' | 'email'
  identifier?: string
  name?: string
  purpose?: 'signup' | 'login' | 'add_phone'
}

const OTP_LENGTH = 6
const RESEND_SECONDS = 30

function getOtpErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data
    if (data && typeof data === 'object') {
      const responseData = data as { message?: unknown; error?: unknown }
      if (typeof responseData.message === 'string' && responseData.message.trim()) {
        return responseData.message
      }
      if (typeof responseData.error === 'string' && responseData.error.trim()) {
        return responseData.error
      }
    }
    if (!error.response) {
      return 'Unable to connect to the server. Please try again.'
    }
  }

  return error instanceof Error ? error.message : 'OTP verification failed. Please try again.'
}

function formatTime(totalSeconds: number) {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const s = String(totalSeconds % 60).padStart(2, '0')
  return `${m}:${s}`
}

export default function OtpVerificationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const otpState = (location.state as OtpPageState | null) ?? {}
  const channel = otpState.channel ?? 'phone'
  const identifier = otpState.identifier ?? otpState.phone
  const name = otpState.name
  const purpose = otpState.purpose ?? (channel === 'email' ? 'signup' : 'login')
  const setAuth = useAuthStore((state) => state.setAuth)

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const verifyMutation = useMutation({
    mutationFn: ({ identifier: otpIdentifier, otp }: { identifier: string; otp: string }) => {
      if (channel === 'email') {
        return verifyEmailSignupOtp({ email: otpIdentifier, otp })
      }
      if (purpose === 'login' || purpose === 'signup') {
        return verifyPhoneLoginOtp({ phone: otpIdentifier, otp, purpose })
      }
      throw new Error('Phone verification is not available in this flow.')
    },
    onSuccess: (response) => {
      setAuth(response.accessToken, response.user)
      if (channel === 'phone' && purpose === 'signup' && response.isNewUser) {
        navigate('/profile-setup', { replace: true, state: { name: '' } })
        return
      }
      navigate('/chats', { replace: true })
    },
  })

  // Return to the relevant sign-in flow if no identifier was passed.
  useEffect(() => {
    if (!identifier) {
      navigate(channel === 'email' ? '/signup' : '/login', { replace: true })
    }
  }, [channel, identifier, navigate])

  // Escape closes the dialog
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') navigate('/')
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])

  // Countdown timer: ticks once per second until it reaches 0
  useEffect(() => {
    if (secondsLeft <= 0) return
    const id = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => window.clearTimeout(id)
  }, [secondsLeft])

  // Focus the first box when the page opens
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  function verify(code: string) {
    if (!identifier || verifyMutation.isPending) return

    verifyMutation.mutate({ identifier, otp: code })
  }

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = digit
    setDigits(next)
    if (verifyMutation.isError) verifyMutation.reset()

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
    if (next.every((d) => d !== '')) verify(next.join(''))
  }

  function handleKeyDown(index: number, event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      const next = [...digits]
      next[index - 1] = ''
      setDigits(next)
      inputRefs.current[index - 1]?.focus()
    }
    if (event.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus()
    if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus()
  }

  // Supports pasting the full 6-digit code (or autofill from SMS)
  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return
    const next = Array(OTP_LENGTH).fill('')
    pasted.split('').forEach((d, i) => (next[i] = d))
    setDigits(next)
    if (verifyMutation.isError) verifyMutation.reset()
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus()
    if (pasted.length === OTP_LENGTH) verify(pasted)
  }

  async function handleResend() {
    if (secondsLeft > 0 || !identifier) return
    try {
      await resendOtp(identifier, purpose)
      setDigits(Array(OTP_LENGTH).fill(''))
      setSecondsLeft(RESEND_SECONDS)
      inputRefs.current[0]?.focus()
      toast.success('A new OTP has been sent.')
    } catch (error) {
      toast.error(getOtpErrorMessage(error))
    }
  }

  if (!identifier) return null

  const canResend = secondsLeft === 0
  const returnTo = channel === 'email' ? '/signup' : '/login'
  const returnState =
    channel === 'email' ? { name, email: identifier } : { phone: identifier }

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
          aria-labelledby="otp-title"
          className="my-auto w-full max-w-[440px] rounded-md bg-white px-7 py-6 shadow-xl"
        >
          <header className="mb-5 flex items-center justify-between">
            <h1 id="otp-title" className="text-2xl font-medium text-gray-700">
              OTP Verification
            </h1>
            <Link
              to="/"
              aria-label="Close verification"
              className="rounded p-1 text-xl font-bold leading-none text-gray-800 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-700"
            >
              ×
            </Link>
          </header>

          <p className="mb-5 text-center text-xs text-gray-600">
            {channel === 'email' ? 'Check your email for your OTP' : 'Check text messages for your OTP'}
            <span className="sr-only">
              {' '}sent to {channel === 'phone' ? '+91 ' : ''}{identifier}
            </span>
          </p>

          <div className="flex justify-between gap-2" role="group" aria-label="Enter 6-digit OTP">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el
                }}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                maxLength={1}
                disabled={verifyMutation.isPending}
                value={digit}
                aria-label={`Digit ${index + 1}`}
                onChange={(e) => handleChange(index, e.currentTarget.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                onFocus={(e) => e.currentTarget.select()}
                className="h-[34px] w-10 rounded-md border border-gray-300 bg-white text-center text-lg text-gray-900 outline-none focus:border-[rgb(224,53,70)] focus:ring-2 focus:ring-[rgb(224,53,70)]/25"
              />
            ))}
          </div>

          {verifyMutation.isError && (
            <p role="alert" className="mt-3 text-center text-sm text-red-600">
              {getOtpErrorMessage(verifyMutation.error)}
            </p>
          )}
          {verifyMutation.isPending && (
            <p className="mt-3 text-center text-sm text-gray-500" role="status">
              Verifying OTP...
            </p>
          )}

          <p
            className="mt-7 text-center text-2xl text-gray-800"
            aria-live="off"
            aria-label={`${secondsLeft} seconds remaining`}
          >
            {formatTime(secondsLeft)}
          </p>

          <p className="mt-3 text-center text-sm text-gray-600">
            Not received OTP?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={!canResend}
              className={
                canResend
                  ? 'font-medium text-[rgb(224,53,70)] hover:underline'
                  : 'cursor-not-allowed text-gray-400'
              }
            >
              Resend Now
            </button>
          </p>

          <p className="mt-5 border-t border-gray-200 pt-3 text-center text-xs text-gray-500">
            Wrong number?{' '}
            <Link
              to={returnTo}
              state={returnState}
              className="text-[rgb(224,53,70)] hover:underline"
            >
              Go back
            </Link>
          </p>
        </section>
      </div>
    </div>
  )
}