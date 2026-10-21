import { Link } from 'react-router'

function NotFound() {
  return (
    <main className="mx-auto max-w-xl p-8 text-center">
      <h1 className="mb-4 text-3xl font-bold">Page not found</h1>
      <Link className="text-blue-600 underline" to="/">
        Return home
      </Link>
    </main>
  )
}

export default NotFound
