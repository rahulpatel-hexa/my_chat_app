import { LegalPageLayout } from '@/components/LegalPageLayout'

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service">
      <p>
        These terms describe the basic rules for using my_chat_app, a team
        messaging application currently provided as a development preview. By
        accessing the app, you agree to use it lawfully and respectfully.
      </p>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Using the service</h2>
        <p>
          You are responsible for activity carried out through your account and
          for keeping any sign-in details secure. Do not use the service to
          harass others, distribute unlawful material, interfere with the app,
          or access accounts or data without permission.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Messages and content</h2>
        <p>
          You retain responsibility for content you submit. Only share content
          that you have the right to use and that is appropriate for its
          audience. Avoid sending passwords, payment details, or other
          sensitive information through this preview.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Availability and changes</h2>
        <p>
          Features may change, be interrupted, or be removed while the app is
          under development. The current preview does not provide production
          authentication, OTP delivery, or Google sign-in. Do not rely on it
          for critical communications or data storage.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Disclaimer</h2>
        <p>
          The app is provided for evaluation and development purposes. To the
          extent permitted by applicable law, it is provided without
          guarantees that it will be uninterrupted, error-free, or suitable
          for a particular purpose.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Contact</h2>
        <p>
          For questions about these terms, use the contact channel provided by
          the project maintainer.
        </p>
      </section>
    </LegalPageLayout>
  )
}
