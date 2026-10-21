import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { useNavigate } from 'react-router'
import apiClient from '@/lib/apiClient'

type AddPhoneModalProps = {
  onSkip: () => void | Promise<void>
  onOtpSent: (phone: string) => void
}

async function sendPhoneOtp(phone: string) {
  await apiClient.post('/users/me/phone/send-otp', { phone })
}

async function saveSkippedPhonePrompt() {
  await apiClient.patch('/users/me', {
    phonePromptSkippedAt: new Date().toISOString(),
  })
}

function getApiErrorMessage(error: unknown) {
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
    if (!error.response) return 'Unable to connect to the server. Please try again.'
  }
  return error instanceof Error ? error.message : 'The request failed. Please try again.'
}

export default function AddPhoneModal({
  onSkip,
  onOtpSent,
}: AddPhoneModalProps) {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [touched, setTouched] = useState(false)

  const sendOtpMutation = useMutation({
    mutationFn: sendPhoneOtp,
    onSuccess: (_, sentPhone) => onOtpSent(sentPhone),
  })

  const skipMutation = useMutation({
    mutationFn: saveSkippedPhonePrompt,
    onSuccess: async () => {
      await onSkip()
      navigate('/chats', { replace: true })
    },
  })

  const isPhoneValid = /^[6-9]\d{9}$/.test(phone)
  const showPhoneError = (touched || submitted) && !isPhoneValid

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    if (!isPhoneValid || sendOtpMutation.isPending) return
    sendOtpMutation.mutate(phone)
  }

  function handleSkip() {
    if (!skipMutation.isPending) skipMutation.mutate()
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
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 id="add-phone-title" className="text-2xl font-medium text-gray-700">
              Add your phone number
            </h1>
            <p id="add-phone-description" className="mt-2 text-sm text-gray-500">
              Friends can find you easily using your number
            </p>
          </div>
          <button
            type="button"
            aria-label="Skip adding your phone number"
            onClick={handleSkip}
            disabled={skipMutation.isPending}
            className="shrink-0 rounded p-1 text-2xl leading-none text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-700 disabled:opacity-50"
          >
            ×
          </button>
        </header>

        <form onSubmit={handleSubmit} noValidate>
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
              disabled={sendOtpMutation.isPending || skipMutation.isPending}
              value={phone}
              onChange={(event) => {
                setPhone(event.currentTarget.value.replace(/\D/g, '').slice(0, 10))
                sendOtpMutation.reset()
              }}
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
              Please enter a valid phone number
            </p>
          )}

          {sendOtpMutation.isError && (
            <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {getApiErrorMessage(sendOtpMutation.error)}
            </p>
          )}
          {skipMutation.isError && (
            <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {getApiErrorMessage(skipMutation.error)}
            </p>
          )}

          <button
            type="submit"
            disabled={!isPhoneValid || sendOtpMutation.isPending || skipMutation.isPending}
            className="mt-5 h-11 w-full rounded-md bg-[rgb(224,53,70)] px-4 text-sm font-medium text-white hover:bg-[rgb(196,38,55)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sendOtpMutation.isPending ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={handleSkip}
            disabled={skipMutation.isPending}
            className="text-sm text-gray-500 underline-offset-4 hover:text-gray-700 hover:underline disabled:opacity-50"
          >
            {skipMutation.isPending ? 'Skipping...' : 'Skip for now'}
          </button>
        </div>
      </section>
    </div>
  )
}
