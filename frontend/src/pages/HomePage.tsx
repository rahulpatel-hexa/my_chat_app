import {
  Bell,
  ChevronDown,
  MessageSquare,
  Paperclip,
  Search,
  type LucideIcon,
} from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "cn"
import { ChatPreview } from "@/features/home/components/ChatPreview"
import teamCollaborationImage from "@/assets/team-collaboration.webp"

const APP_NAME = "my_chat_app"

type Feature = {
  icon: LucideIcon
  title: string
  description: string
}

const FEATURES: Feature[] = [
  {
    icon: MessageSquare,
    title: "Channels and direct messages",
    description:
      "Keep each project in its own channel and talk one-on-one when something doesn't belong in front of everyone.",
  },
  {
    icon: Search,
    title: "Search your full history",
    description:
      "Find any message, person or file from months ago without scrolling back through the thread.",
  },
  {
    icon: Paperclip,
    title: "Share files in the conversation",
    description:
      "Drop in images, documents and links. They stay attached to the message they came with.",
  },
  {
    icon: Bell,
    title: "Notifications you control",
    description:
      "Choose what reaches you per channel, and set quiet hours so work stays out of your evenings.",
  },
]

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <a href="/" className="flex items-center gap-2 font-semibold tracking-tight text-white">
          <span
            className="grid size-7 place-items-center rounded-md bg-white/15 text-white"
            aria-hidden="true"
          >
            <MessageSquare className="size-4" />
          </span>
          {APP_NAME}
        </a>

        <nav className="flex items-center gap-2" aria-label="Account">
          <a
            href="/login"
            className={buttonVariants({
              variant: "ghost",
              className: "text-white hover:bg-white/15 hover:text-white",
            })}
          >
            Log in
          </a>
          <a
            href="/signup"
            className={buttonVariants({
              className: "bg-white text-slate-950 hover:bg-white/90",
            })}
          >
            Sign up
          </a>
        </nav>
      </header>

      <main id="main" className="flex-1">
        <section className="relative isolate flex min-h-svh items-center justify-center overflow-hidden bg-slate-950 px-6 py-32 text-center text-white">
          <img
            src={teamCollaborationImage}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 z-0 size-full object-cover object-center"
          />
          <div
            className="absolute inset-0 z-0 bg-gradient-to-b from-slate-950/65 via-slate-950/60 to-slate-950/85"
            aria-hidden="true"
          />

          <div className="relative z-10 mx-auto max-w-3xl">
            <p className="text-lg font-semibold tracking-tight text-white/90 sm:text-xl">
              {APP_NAME}
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight text-balance sm:text-5xl md:text-7xl">
              Make every team conversation count.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
              Bring messages, channels, and shared files together so your team
              can focus on the work—not searching for the conversation.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href="/signup"
                className={buttonVariants({
                  size: "lg",
                  className: "bg-white text-slate-950 hover:bg-white/90",
                })}
              >
                Create a free account
              </a>
              <a
                href="/login"
                className={buttonVariants({
                  size: "lg",
                  variant: "outline",
                  className:
                    "border-white/50 bg-white/10 text-white hover:bg-white/20 hover:text-white",
                })}
              >
                Log in
              </a>
            </div>
          </div>

          <a
            href="#chat-preview"
            className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 text-xs text-white/80 transition-colors hover:text-white"
          >
            See how it works
            <ChevronDown className="size-4" aria-hidden="true" />
          </a>
        </section>

        <section
          id="chat-preview"
          className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:py-20"
        >
          <div className="max-w-lg">
            <p className="text-sm font-medium text-primary">A better way to chat</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Conversations that keep moving.
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Try the live preview. Send a message and see how a focused,
              friendly conversation feels.
            </p>
          </div>
          <div className="flex justify-center md:justify-end">
            <ChatPreview />
          </div>
        </section>

        {/* Features: a plain two-column list, no cards */}
        <section className="border-t bg-muted/40">
          <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-20 md:grid-cols-[1fr_2fr]">
            <h2 className="max-w-xs text-3xl font-semibold tracking-tight text-balance">
              Everything a conversation needs
            </h2>

            <dl className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex gap-4">
                  <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                  <div>
                    <dt className="font-medium">{title}</dt>
                    <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {description}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Closing call to action */}
        <section className="mx-auto w-full max-w-6xl px-6 py-20">
          <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-primary px-8 py-12 text-primary-foreground sm:flex-row sm:items-center">
            <h2 className="max-w-md text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              Start your first conversation today.
            </h2>
            <a
              href="/signup"
              className={cn(buttonVariants({ size: "lg", variant: "secondary" }))}
            >
              Create a free account
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-3 px-6 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} {APP_NAME}
          </p>
          <nav className="flex gap-5" aria-label="Footer">
            <a href="/privacy" className="hover:text-foreground">
              Privacy
            </a>
            <a href="/terms" className="hover:text-foreground">
              Terms
            </a>
            <a href="/contact" className="hover:text-foreground">
              Contact
            </a>
          </nav>
        </div>
      </footer>
    </div>
  )
}