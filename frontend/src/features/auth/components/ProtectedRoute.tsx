import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuthStore } from '@/features/auth/store/useAuthStore'

export default function ProtectedRoute() {
  const sessionStatus = useAuthStore((state) => state.sessionStatus)
  const sessionError = useAuthStore((state) => state.sessionError)
  const location = useLocation()

  if (sessionStatus === 'loading') {
    return (
      <main className="grid min-h-screen place-items-center bg-white text-sm text-gray-500">
        Restoring your session…
      </main>
    )
  }

  if (sessionStatus === 'error') {
    return (
      <main className="grid min-h-screen place-items-center bg-white p-6">
        <div className="max-w-sm text-center">
          <p role="alert" className="text-sm text-red-700">{sessionError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-md bg-[rgb(224,53,70)] px-4 py-2 text-sm font-medium text-white hover:bg-[rgb(196,38,55)]"
          >
            Retry
          </button>
        </div>
      </main>
    )
  }

  return sessionStatus === 'authenticated'
    ? <Outlet />
    : <Navigate to="/login" replace state={{ from: location }} />
}
