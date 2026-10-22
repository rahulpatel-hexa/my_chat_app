import { useState } from 'react'

type AvatarProps = {
  name: string
  avatarUrl?: string
  size?: 'sm' | 'md' | 'lg'
  isOnline?: boolean
}

const sizeClasses = {
  sm: 'size-10 text-sm',
  md: 'size-11 text-base',
  lg: 'size-12 text-lg',
}

const colors = [
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
  'bg-orange-100 text-orange-700',
]

export default function Avatar({
  name,
  avatarUrl,
  size = 'md',
  isOnline = false,
}: AvatarProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
  const color = colors[(name.charCodeAt(0) || 0) % colors.length]

  return (
    <span className="relative block shrink-0">
      {avatarUrl && failedUrl !== avatarUrl ? (
        <img
          src={avatarUrl}
          alt={`${name}'s avatar`}
          className={`${sizeClasses[size]} rounded-full object-cover`}
          onError={() => setFailedUrl(avatarUrl)}
        />
      ) : (
        <span
          aria-hidden="true"
          className={`${sizeClasses[size]} ${color} grid place-items-center rounded-full font-semibold`}
        >
          {initials || '?'}
        </span>
      )}
      {isOnline && (
        <span
          aria-label="Online"
          className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-white bg-emerald-500"
        />
      )}
    </span>
  )
}
