import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import {
  requestProfilePhoneOtp,
  verifyProfilePhoneOtp,
} from '@/features/auth/api/authApi'
import { useAuthStore } from '@/features/auth/store/useAuthStore'

function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data
    if (data && typeof data === 'object') {
      const message = (data as { message?: unknown }).message
      if (typeof message === 'string' && message.trim()) return message
    }
    if (!error.response) return 'Unable to connect to the server. Please try again.'
  }
  return error instanceof Error ? error.message : 'The request failed. Please try again.'
}

export default function AddPhoneModal() {
  const navigate = useNavigate()
  const updateAuthUser = useAuthStore((state) => state.updateUser)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSentTo, setOtpSentTo] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [touched, setTouched] = useState(false)

  const sendOtpMutation = useMutation({
    mutationFn: requestProfilePhoneOtp,
    onSuccess: (_, sentPhone) => {
      setOtpSentTo(sentPhone)
      setOtp('')
      toast.success('Verification code sent to your phone.')
    },
  })

  const verifyOtpMutation = useMutation({
    mutationFn: ({ targetPhone, code }: { targetPhone: string; code: string }) =>
      verifyProfilePhoneOtp(targetPhone, code),
    onSuccess: (user) => {
      updateAuthUser(user)
      toast.success('Phone number verified.')
      navigate('/chats', { replace: true })
    },
  })

  const isPhoneValid = /^[6-9]\d{9}$/.test(phone)
  const showPhoneError = (touched || submitted) && !isPhoneValid

  function handlePhoneSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    if (!isPhoneValid || sendOtpMutation.isPending) return
    sendOtpMutation.mutate(phone)
  }

  function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (otp.length !== 6 || verifyOtpMutation.isPending || otpSentTo !== phone) return
    verifyOtpMutation.mutate({ targetPhone: phone, code: otp })
  }

  function handlePhoneChange(value: string) {
    setPhone(value.replace(/\D/g, '').slice(0, 10))
    setOtpSentTo(null)
    setOtp('')
    sendOtpMutation.reset()
    verifyOtpMutation.reset()
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/85 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-phone-title"
        aria-describedby="add-phone-description"
        className="my-auto w-full max-w-[440px] rounded-lg bg-white px-7 py-6 shadow-xl"
      >
        <header className="mb-6">
          <h1 id="add-phone-title" className="text-2xl font-medium text-gray-700">
            Verify your phone number
          </h1>
          <p id="add-phone-description" className="mt-2 text-sm leading-6 text-gray-500">
            Verify a phone number to secure your account and continue to your chats.
          </p>
        </header>

        <form onSubmit={handlePhoneSubmit} noValidate>
          <label htmlFor="add-phone-number" className="mb-2 block text-sm font-medium text-gray-700">
            Phone number
          </label>
          <div
            className={`flex h-11 items-center rounded-md border bg-white ${
              showPhoneError ? 'border-red-600' : 'border-gray-300'
            }`}
          >
            <span
              aria-label="Country calling code India"
              className="select-none border-r border-gray-300 px-3 text-gray-600"
            >
              +91
            </span>
            <input
              id="add-phone-number"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={10}
              disabled={sendOtpMutation.isPending || verifyOtpMutation.isPending}
              value={phone}
              onChange={(event) => handlePhoneChange(event.currentTarget.value)}
              onBlur={() => setTouched(true)}
              placeholder="98765 43210"
              aria-label="10-digit phone number"
              aria-invalid={showPhoneError}
              aria-describedby={showPhoneError ? 'add-phone-error' : undefined}
              className="h-full min-w-0 flex-1 rounded-r-md border-0 bg-transparent px-3 text-gray-900 outline-none placeholder:text-gray-400 focus:ring-0"
            />
          </div>
          {showPhoneError && (
            <p id="add-phone-error" role="alert" className="mt-1 text-sm text-red-600">
              Please enter a valid 10-digit phone number.
            </p>
          )}

          {sendOtpMutation.isError && (
            <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {getApiErrorMessage(sendOtpMutation.error)}
            </p>
          )}

          <button
            type="submit"
            disabled={!isPhoneValid || sendOtpMutation.isPending || verifyOtpMutation.isPending}
            className="mt-4 h-11 w-full rounded-md bg-[rgb(224,53,70)] px-4 text-sm font-medium text-white hover:bg-[rgb(196,38,55)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sendOtpMutation.isPending
              ? 'Sending code…'
              : otpSentTo === phone
                ? 'Send code again'
                : 'Send verification code'}
          </button>
        </form>

        {otpSentTo === phone && (
          <form onSubmit={handleVerify} className="mt-5 border-t border-gray-100 pt-5">
            <label htmlFor="add-phone-otp" className="mb-2 block text-sm font-medium text-gray-700">
              Verification code
            </label>
            <div className="flex gap-2">
              <input
                id="add-phone-otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(event) => {
                  setOtp(event.currentTarget.value.replace(/\D/g, '').slice(0, 6))
                  verifyOtpMutation.reset()
                }}
                placeholder="Enter 6-digit code"
                aria-label="6-digit verification code"
                className="h-11 min-w-0 flex-1 rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-300/50"
              />
              <button
                type="submit"
                disabled={otp.length !== 6 || verifyOtpMutation.isPending}
                className="h-11 rounded-md bg-gray-900 px-4 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {verifyOtpMutation.isPending ? 'Verifying…' : 'Verify'}
              </button>
            </div>
            {verifyOtpMutation.isError && (
              <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {getApiErrorMessage(verifyOtpMutation.error)}
              </p>
            )}
          </form>
        )}
      </section>
    </div>
  )
}
