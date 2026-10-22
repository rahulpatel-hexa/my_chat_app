import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { Camera, LoaderCircle } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'
import apiClient from '@/lib/apiClient'
import { useAuthStore, type AuthUser } from '@/features/auth/store/useAuthStore'
import HomePage from '@/pages/HomePage'

type ProfileFields = {
  name: string
  about: string
  avatar: File | null
}

async function updateProfile({ name, about, avatar }: ProfileFields) {
  const formData = new FormData()
  formData.append('name', name)
  formData.append('about', about)
  if (avatar) formData.append('avatar', avatar)

  const response = await apiClient.patch<{ user: AuthUser }>('/users/me', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data.user
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
  return error instanceof Error ? error.message : 'Unable to update profile. Please try again.'
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join('')
}

export default function ProfileSetupPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const initialName = (location.state as { name?: string } | null)?.name ?? ''
  const [name, setName] = useState(initialName)
  const [about, setAbout] = useState('Hey there!')
  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarError, setAvatarError] = useState('')
  const [nameTouched, setNameTouched] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const updateAuthUser = useAuthStore((state) => state.updateUser)

  const avatarPreview = useMemo(
    () => (avatar ? URL.createObjectURL(avatar) : null),
    [avatar],
  )

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    }
  }, [avatarPreview])

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (user) => {
      updateAuthUser(user)
      navigate('/chats', { replace: true })
    },
  })

  const trimmedName = name.trim()
  const nameError =
    trimmedName.length === 0
      ? 'Please enter your name.'
      : trimmedName.length < 2
        ? 'Name must be at least 2 characters.'
        : trimmedName.length > 50
          ? 'Name must be 50 characters or fewer.'
          : ''
  const showNameError = Boolean(nameError) && (nameTouched || submitAttempted)
  const canContinue = !nameError && !avatarError && !mutation.isPending

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0] ?? null
    event.currentTarget.value = ''
    if (file && !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setAvatarError('Please select a JPEG, PNG, or WebP image.')
      return
    }
    if (file && file.size > 5 * 1024 * 1024) {
      setAvatarError('Profile photo must be 5 MB or smaller.')
      return
    }
    setAvatarError('')
    setAvatar(file)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitAttempted(true)
    if (nameError || avatarError || mutation.isPending) return
    mutation.mutate({ name: trimmedName, about, avatar })
  }

  return (
    <div className="relative min-h-screen">
      <div aria-hidden="true" inert>
        <HomePage />
      </div>

      <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/85 p-4">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-setup-title"
          aria-describedby="profile-setup-description"
          className="my-auto w-full max-w-[440px] rounded-md bg-white px-7 py-6 shadow-xl"
        >
          <header className="mb-6 text-center">
            <h1
              id="profile-setup-title"
              className="mb-2 text-2xl font-medium text-gray-700"
            >
              Set up your profile
            </h1>
            <p id="profile-setup-description" className="text-sm text-gray-500">
              Add your name so friends can find you
            </p>
          </header>

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-5 flex flex-col items-center">
              <div className="relative">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Profile avatar preview"
                    className="size-24 rounded-full border border-gray-200 object-cover"
                  />
                ) : (
                  <div
                    aria-label={`Avatar initials: ${getInitials(name)}`}
                    className="grid size-24 place-items-center rounded-full bg-[rgb(224,53,70)] text-2xl font-semibold text-white"
                  >
                    {getInitials(name)}
                  </div>
                )}
                <label
                  htmlFor="profile-avatar"
                  className="absolute bottom-0 right-0 grid size-9 cursor-pointer place-items-center rounded-full border-2 border-white bg-gray-100 text-gray-700 hover:bg-gray-200 focus-within:ring-2 focus-within:ring-[rgb(224,53,70)]"
                  aria-label="Upload profile photo"
                >
                  <Camera aria-hidden="true" className="size-4" />
                </label>
                <input
                  id="profile-avatar"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="sr-only"
                  aria-describedby={avatarError ? 'avatar-error' : undefined}
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">Add a photo (optional)</p>
              {avatarError && (
                <p id="avatar-error" role="alert" className="mt-1 text-sm text-red-600">
                  {avatarError}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="profile-name" className="mb-2 block text-sm font-medium text-gray-700">
                Full name <span className="text-red-600">*</span>
              </label>
              <input
                id="profile-name"
                type="text"
                autoComplete="name"
                maxLength={50}
                value={name}
                onChange={(event) => {
                  setName(event.currentTarget.value)
                  mutation.reset()
                }}
                onBlur={() => setNameTouched(true)}
                aria-invalid={showNameError}
                aria-describedby={showNameError ? 'profile-name-error' : undefined}
                placeholder="Your full name"
                className="h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-300/50 aria-invalid:border-red-600"
              />
              {showNameError && (
                <p id="profile-name-error" role="alert" className="mt-1 text-sm text-red-600">
                  {nameError}
                </p>
              )}
            </div>

            <div className="mb-5">
              <label htmlFor="profile-about" className="mb-2 block text-sm font-medium text-gray-700">
                About <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                id="profile-about"
                maxLength={140}
                rows={3}
                value={about}
                onChange={(event) => setAbout(event.currentTarget.value)}
                placeholder="Hey there!"
                className="w-full resize-none rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-300/50"
              />
              <p className="mt-1 text-right text-xs text-gray-500" aria-live="polite">
                {about.length}/140
              </p>
            </div>

            {mutation.isError && (
              <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {getApiErrorMessage(mutation.error)}
              </p>
            )}

            <button
              type="submit"
              disabled={!canContinue}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[rgb(224,53,70)] px-4 text-sm font-medium text-white hover:bg-[rgb(196,38,55)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {mutation.isPending && (
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              )}
              {mutation.isPending ? 'Saving profile...' : 'Continue'}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
