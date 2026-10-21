import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { MessageSquare } from 'lucide-react'

type LegalPageLayoutProps = {
  title: string
  children: ReactNode
}

export function LegalPageLayout({ title, children }: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <MessageSquare className="size-5 text-primary" aria-hidden="true" />
            my_chat_app
          </Link>
          <Link to="/signup" className="text-sm text-primary hover:underline">
            Create account
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-6 py-12 sm:py-16">
        <Link to="/signup" className="text-sm text-primary hover:underline">
          ← Back to signup
        </Link>
        <article className="mt-6">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Last updated: October 14, 2026
          </p>
          <div className="mt-8 space-y-8 leading-7 text-muted-foreground">{children}</div>
        </article>
      </main>

      <footer className="border-t">
        <nav
          className="mx-auto flex w-full max-w-4xl gap-5 px-6 py-6 text-sm text-muted-foreground"
          aria-label="Legal"
        >
          <Link to="/terms" className="hover:text-foreground">
            Terms of Service
          </Link>
          <Link to="/privacy" className="hover:text-foreground">
            Privacy Policy
          </Link>
        </nav>
      </footer>
    </div>
  )
}
