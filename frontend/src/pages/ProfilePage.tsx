import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  ArrowLeft,
  Camera,
  Check,
  Mail,
  Pencil,
  Phone,
  Save,
  UserRound,
  X,
} from 'lucide-react'
import { Link } from 'react-router'
import apiClient from '@/lib/apiClient'
import { useAuthStore, type AuthUser } from '@/features/auth/store/useAuthStore'
import Sidebar from '@/features/chat/components/Sidebar'

type ProfileForm = {
  name: string
  about: string
  description: string
  avatar: File | null
}

async function fetchProfile() {
  const response = await apiClient.get<{ user: AuthUser }>('/users/me')
  return response.data.user
}

async function saveProfile({ name, about, description, avatar }: ProfileForm) {
  const formData = new FormData()
  formData.append('name', name)
  formData.append('about', about)
  formData.append('description', description)
  if (avatar) formData.append('avatar', avatar)

  const response = await apiClient.patch<{ user: AuthUser }>('/users/me', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data.user
}

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data
    if (data && typeof data === 'object') {
      const message = (data as { message?: unknown }).message
      if (typeof message === 'string' && message.trim()) return message
    }
    if (!error.response) return 'Unable to connect to the server. Please try again.'
  }
  return error instanceof Error ? error.message : 'Unable to save your profile. Please try again.'
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?'
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound
  label: string
  value: string
}) {
  return (
    <div className="flex gap-3 py-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-rose-50 text-[rgb(224,53,70)]">
        <Icon aria-hidden="true" className="size-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">{label}</p>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-gray-800">
          {value || 'Not added yet'}
        </p>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const queryClient = useQueryClient()
  const authUser = useAuthStore((state) => state.user)
  const updateAuthUser = useAuthStore((state) => state.updateUser)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(authUser?.name ?? '')
  const [about, setAbout] = useState(authUser?.about ?? '')
  const [description, setDescription] = useState(authUser?.description ?? '')
  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarError, setAvatarError] = useState('')
  const [nameTouched, setNameTouched] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const profileQuery = useQuery({
    queryKey: ['current-user-profile'],
    queryFn: fetchProfile,
  })
  const profile = profileQuery.data ?? authUser

  const avatarPreview = useMemo(
    () => (avatar ? URL.createObjectURL(avatar) : null),
    [avatar],
  )

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    }
  }, [avatarPreview])

  const saveMutation = useMutation({
    mutationFn: saveProfile,
    onSuccess: (updatedUser) => {
      updateAuthUser(updatedUser)
      queryClient.setQueryData(['current-user-profile'], updatedUser)
      setEditing(false)
      setAvatar(null)
      setAvatarError('')
    },
  })

  const trimmedName = name.trim()
  const nameError =
    trimmedName.length < 2
      ? 'Name must be at least 2 characters.'
      : trimmedName.length > 50
        ? 'Name must be 50 characters or fewer.'
        : ''

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0] ?? null
    event.currentTarget.value = ''
    if (!file) return
    if (file && !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setAvatarError('Choose a JPEG, PNG, or WebP image.')
      return
    }
    if (file && file.size > 5 * 1024 * 1024) {
      setAvatarError('The photo must be 5 MB or smaller.')
      return
    }
    setAvatarError('')
    if (!editing) beginEditing()
    setAvatar(file)
  }

  function cancelEditing() {
    setName(profile?.name ?? '')
    setAbout(profile?.about ?? '')
    setDescription(profile?.description ?? '')
    setAvatar(null)
    setAvatarError('')
    setNameTouched(false)
    saveMutation.reset()
    setEditing(false)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNameTouched(true)
    if (nameError || avatarError || saveMutation.isPending) return
    saveMutation.mutate({
      name: trimmedName,
      about: about.trim(),
      description: description.trim(),
      avatar,
    })
  }

  const nameHasError = Boolean(nameError) && nameTouched

  function beginEditing() {
    if (!profile) return
    setName(profile.name)
    setAbout(profile.about ?? '')
    setDescription(profile.description ?? '')
    setNameTouched(false)
    saveMutation.reset()
    setEditing(true)
  }

  function chooseAvatar() {
    if (!editing) beginEditing()
    avatarInputRef.current?.click()
  }

  return (
    <div className="fixed inset-0 flex h-[100dvh] overflow-hidden bg-[#f7f8fa] font-sans text-gray-800">
      <div className="hidden h-full shrink-0 md:block">
        <Sidebar />
      </div>

      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <header className="sticky top-0 z-10 flex h-[68px] shrink-0 items-center justify-between border-b border-gray-200/80 bg-white/95 px-4 backdrop-blur sm:px-7">
          <div className="flex items-center gap-3">
            <Link
              to="/chats"
              aria-label="Back to chats"
              className="grid size-9 place-items-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 md:hidden"
            >
              <ArrowLeft aria-hidden="true" className="size-5" />
            </Link>
            <div>
              <p className="text-sm font-semibold text-gray-900">Your profile</p>
              <p className="hidden text-xs text-gray-500 sm:block">Manage your personal details</p>
            </div>
          </div>

          {profile && !profileQuery.isLoading && (
            editing ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={saveMutation.isPending}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  <X aria-hidden="true" className="size-4" />
                  <span className="hidden sm:inline">Cancel</span>
                </button>
                <button
                  type="submit"
                  form="profile-edit-form"
                  disabled={saveMutation.isPending || Boolean(nameError) || Boolean(avatarError)}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-[rgb(224,53,70)] px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[rgb(196,38,55)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saveMutation.isPending ? (
                    <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : (
                    <Save aria-hidden="true" className="size-4" />
                  )}
                  <span>{saveMutation.isPending ? 'Saving…' : 'Save changes'}</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={beginEditing}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-[rgb(224,53,70)] px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[rgb(196,38,55)]"
              >
                <Pencil aria-hidden="true" className="size-4" />
                Edit profile
              </button>
            )
          )}
        </header>

        <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-7 sm:px-7 sm:py-10">
          {profileQuery.isLoading && !profile ? (
            <div role="status" className="animate-pulse space-y-5">
              <div className="h-40 rounded-2xl bg-gray-200" />
              <div className="h-56 rounded-2xl bg-white" />
              <span className="sr-only">Loading profile…</span>
            </div>
          ) : profileQuery.isError && !profile ? (
            <section className="rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
              <p role="alert" className="text-sm text-red-700">{getErrorMessage(profileQuery.error)}</p>
              <button
                type="button"
                onClick={() => void profileQuery.refetch()}
                className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
              >
                Try again
              </button>
            </section>
          ) : profile ? (
            <div className="space-y-6">
              <section className="relative rounded-2xl border border-rose-100 bg-white shadow-sm">
                <div className="h-36 bg-gradient-to-r from-rose-100 via-pink-50 to-orange-50 sm:h-44">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-36 overflow-hidden rounded-t-2xl sm:h-44">
                    <div className="absolute right-0 top-0 h-44 w-44 translate-x-12 -translate-y-16 rounded-full bg-white/40 blur-2xl" />
                    <div className="absolute right-24 top-10 size-20 rounded-full border border-white/60 bg-white/20" />
                  </div>
                </div>
                <div className="relative px-4 pb-5 sm:px-8 sm:pb-6">
                  <div className="flex min-w-0 items-end gap-4 sm:gap-5">
                    <div className="-mt-10 flex shrink-0 flex-col items-center gap-2 sm:-mt-12">
                      <div
                        className="relative shrink-0 overflow-visible"
                        style={{ width: 88, height: 88, minWidth: 88, minHeight: 88 }}
                      >
                        {avatarPreview || profile.avatarUrl ? (
                          <img
                            src={avatarPreview ?? profile.avatarUrl ?? undefined}
                            alt={`${profile.name}'s profile`}
                            className="block rounded-2xl border-4 border-white bg-white object-cover shadow-md"
                            style={{
                              width: 88,
                              height: 88,
                              maxWidth: 'none',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <div
                            className="grid place-items-center rounded-2xl border-4 border-white bg-rose-100 text-2xl font-semibold text-rose-700 shadow-md"
                            style={{ width: 88, height: 88 }}
                          >
                            {getInitials(name || profile.name)}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={chooseAvatar}
                          title="Change profile photo"
                          aria-label="Change profile photo"
                          className="absolute bottom-1 right-1 z-10 grid size-10 place-items-center rounded-full border-2 border-white bg-gray-900 text-white shadow-md transition hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
                          style={{ position: 'absolute', right: 4, bottom: 4 }}
                        >
                          <Camera aria-hidden="true" className="size-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={chooseAvatar}
                        className="inline-flex min-h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-1 text-xs font-semibold text-gray-600 transition hover:bg-rose-50 hover:text-[rgb(224,53,70)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
                      >
                        <Camera aria-hidden="true" className="size-3.5" />
                        Change photo
                      </button>
                      <input
                        ref={avatarInputRef}
                        id="profile-page-avatar"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleAvatarChange}
                        className="sr-only"
                      />
                    </div>
                    <div className="min-w-0 flex-1 pb-1">
                      <p className="break-words text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
                        {editing ? name || 'Your name' : profile.name}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                        <Mail aria-hidden="true" className="size-4 shrink-0" />
                        <span className="truncate">{profile.email || 'No email added'}</span>
                      </p>
                    </div>
                    <span className="mb-1 hidden shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 sm:inline-flex">
                      <Check aria-hidden="true" className="size-3.5" />
                      Profile
                    </span>
                  </div>
                  {avatarError && (
                    <p role="alert" className="mt-3 text-sm text-red-600">{avatarError}</p>
                  )}
                </div>
              </section>

              {editing ? (
                <form
                  id="profile-edit-form"
                  onSubmit={handleSubmit}
                  className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8"
                  noValidate
                >
                  <div className="mb-6">
                    <h1 className="text-lg font-semibold text-gray-900">Personal information</h1>
                    <p className="mt-1 text-sm text-gray-500">
                      Keep your profile details up to date.
                    </p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="profile-name" className="mb-2 block text-sm font-medium text-gray-700">
                        Full name
                      </label>
                      <input
                        id="profile-name"
                        value={name}
                        onChange={(event) => {
                          setName(event.currentTarget.value)
                          saveMutation.reset()
                        }}
                        onBlur={() => setNameTouched(true)}
                        maxLength={50}
                        autoComplete="name"
                        aria-invalid={nameHasError}
                        aria-describedby={nameHasError ? 'profile-name-error' : undefined}
                        className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 aria-invalid:border-red-500"
                        placeholder="Your full name"
                      />
                      {nameHasError && (
                        <p id="profile-name-error" role="alert" className="mt-1.5 text-xs text-red-600">
                          {nameError}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="profile-email" className="mb-2 block text-sm font-medium text-gray-700">
                        Email address
                        <span className="ml-2 text-xs font-normal text-gray-400">Not editable</span>
                      </label>
                      <input
                        id="profile-email"
                        value={profile.email ?? ''}
                        readOnly
                        aria-readonly="true"
                        className="h-11 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3.5 text-sm text-gray-500 outline-none"
                      />
                    </div>
                    {profile.phone && (
                      <div className="sm:col-span-2">
                        <label htmlFor="profile-phone" className="mb-2 block text-sm font-medium text-gray-700">
                          Phone number
                        </label>
                        <input
                          id="profile-phone"
                          value={`+91 ${profile.phone}`}
                          readOnly
                          className="h-11 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3.5 text-sm text-gray-500 outline-none"
                        />
                      </div>
                    )}
                    <div className="sm:col-span-2">
                      <label htmlFor="profile-about" className="mb-2 block text-sm font-medium text-gray-700">
                        About
                      </label>
                      <textarea
                        id="profile-about"
                        value={about}
                        onChange={(event) => setAbout(event.currentTarget.value)}
                        maxLength={140}
                        rows={2}
                        placeholder="A short line about you"
                        className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3.5 py-3 text-sm leading-6 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                      />
                      <p className="mt-1 text-right text-xs text-gray-400">{about.length}/140</p>
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="profile-description" className="mb-2 block text-sm font-medium text-gray-700">
                        Description
                        <span className="ml-2 text-xs font-normal text-gray-400">Optional</span>
                      </label>
                      <textarea
                        id="profile-description"
                        value={description}
                        onChange={(event) => setDescription(event.currentTarget.value)}
                        maxLength={500}
                        rows={4}
                        placeholder="Tell people a little more about yourself"
                        className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3.5 py-3 text-sm leading-6 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                      />
                      <p className="mt-1 text-right text-xs text-gray-400">{description.length}/500</p>
                    </div>
                  </div>

                  {saveMutation.isError && (
                    <p role="alert" className="mt-5 rounded-lg border border-red-100 bg-red-50 px-3.5 py-3 text-sm text-red-700">
                      {getErrorMessage(saveMutation.error)}
                    </p>
                  )}
                </form>
              ) : (
                <section className="rounded-2xl border border-gray-100 bg-white px-5 shadow-sm sm:px-8">
                  <div className="border-b border-gray-100 py-5">
                    <h2 className="text-base font-semibold text-gray-900">Personal information</h2>
                    <p className="mt-1 text-sm text-gray-500">Your profile details at a glance.</p>
                  </div>
                  <div className="divide-y divide-gray-100 sm:grid sm:grid-cols-2 sm:divide-y-0 sm:gap-x-10">
                    <Detail icon={UserRound} label="Full name" value={profile.name} />
                    <Detail icon={Mail} label="Email address" value={profile.email ?? ''} />
                    {profile.phone && (
                      <Detail icon={Phone} label="Phone number" value={`+91 ${profile.phone}`} />
                    )}
                    <Detail icon={UserRound} label="About" value={profile.about} />
                    <div className="sm:col-span-2">
                      <Detail icon={Pencil} label="Description" value={profile.description ?? ''} />
                    </div>
                  </div>
                </section>
              )}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  )
}
