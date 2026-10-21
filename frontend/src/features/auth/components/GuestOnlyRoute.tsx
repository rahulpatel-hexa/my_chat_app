import { Navigate, Outlet } from 'react-router'
import { useAuthStore } from '@/features/auth/store/useAuthStore'

export default function GuestOnlyRoute() {
  const sessionStatus = useAuthStore((state) => state.sessionStatus)

  if (sessionStatus === 'loading') {
    return (
      <main className="grid min-h-screen place-items-center bg-white text-sm text-gray-500">
        Restoring your session…
      </main>
    )
  }

  if (sessionStatus === 'authenticated') {
    return <Navigate to="/chats" replace />
  }

  return <Outlet />
}
