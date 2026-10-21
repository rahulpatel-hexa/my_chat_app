import { LegalPageLayout } from '@/components/LegalPageLayout'

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy">
      <p>
        This policy explains how information may be handled when you use
        my_chat_app. The app is currently a development preview, and its
        authentication and account-creation forms are not connected to a
        production backend.
      </p>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Information you enter</h2>
        <p>
          The interface may ask for your name, email address, or phone number
          to demonstrate signup and login flows. At present, submitting those
          forms only displays an on-screen notice; it does not send an OTP or
          create an account through this frontend.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Chat content</h2>
        <p>
          The chat preview uses sample messages and locally managed demo
          interactions. Do not enter real personal, confidential, or sensitive
          information. This preview is not intended to be a secure messaging
          or records-storage service.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">How information is used</h2>
        <p>
          Information entered into the current demo is used to demonstrate
          form validation and interface behavior. The frontend may use
          essential browser storage or technical data required for the app to
          function; no analytics or advertising use is described by this
          preview.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Third-party services</h2>
        <p>
          Google sign-in is shown as a demo option but is not currently
          integrated. If external services are added later, this policy should
          be updated to identify them and explain how they handle information.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Changes and questions</h2>
        <p>
          This policy may be updated as the project gains backend features.
          For questions about privacy, use the contact channel provided by the
          project maintainer.
        </p>
      </section>
    </LegalPageLayout>
  )
}
