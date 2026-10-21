import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signupSchema, type SignupFormValues } from '../signupSchema'

import { Button } from '@/components/ui/button'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'

type SignupFormProps = {
  onSubmit: (values: SignupFormValues) => void | Promise<void>
  onTermsAgreementChange?: (agreed: boolean) => void
  initialName?: string
  initialEmail?: string
}

export default function SignupForm({
  onSubmit,
  onTermsAgreementChange,
  initialName = '',
  initialEmail = '',
}: SignupFormProps) {
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: initialName,
      email: initialEmail,
      agreedToTerms: false,
    },
  })
  const { errors, isSubmitting } = form.formState
  const agreedToTerms = form.watch('agreedToTerms')
  const termsRegistration = form.register('agreedToTerms')

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup className="gap-5">
        <Field data-invalid={Boolean(errors.fullName)}>
          <FieldLabel htmlFor="full-name" className="sr-only">
            Full name
          </FieldLabel>
          <Input
            id="full-name"
            type="text"
            autoComplete="name"
            placeholder="Full Name"
            aria-label="Full name"
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? 'full-name-error' : undefined}
            className="h-12 rounded-md border-gray-300 bg-white px-3 text-gray-900 shadow-none outline-none focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/30 aria-invalid:border-red-600 aria-invalid:ring-2 aria-invalid:ring-red-600/20"
            {...form.register('fullName')}
          />
          <FieldError
            id="full-name-error"
            errors={errors.fullName ? [errors.fullName] : undefined}
            className="text-red-600"
          />
        </Field>

        <Field data-invalid={Boolean(errors.email)}>
          <FieldLabel htmlFor="signup-email" className="sr-only">
            Email
          </FieldLabel>
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder="Email"
            aria-label="Email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'signup-email-error' : undefined}
            className="h-12 rounded-md border-gray-300 bg-white px-3 text-gray-900 shadow-none outline-none focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/30 aria-invalid:border-red-600 aria-invalid:ring-2 aria-invalid:ring-red-600/20"
            {...form.register('email')}
          />
          <FieldError
            id="signup-email-error"
            errors={errors.email ? [errors.email] : undefined}
            className="text-red-600"
          />
        </Field>

        <Field data-invalid={Boolean(errors.agreedToTerms)} className="gap-2">
          <div className="flex items-start gap-3">
            <input
              id="signup-terms"
              type="checkbox"
              aria-invalid={Boolean(errors.agreedToTerms)}
              aria-describedby={errors.agreedToTerms ? 'signup-terms-error' : undefined}
              className="mt-1 size-4 shrink-0 cursor-pointer appearance-auto rounded-sm border border-gray-400 accent-[rgb(224,53,70)]"
              {...termsRegistration}
              onChange={(event) => {
                void termsRegistration.onChange(event)
                onTermsAgreementChange?.(event.currentTarget.checked)
              }}
            />
            <label
              htmlFor="signup-terms"
              className="min-w-0 flex-1 whitespace-normal text-sm leading-5 text-gray-500"
            >
              I agree to the
              {' '}
              <a href="/terms" className="text-[rgb(224,53,70)] hover:underline">
                Terms of Service
              </a>
              , and
              {' '}
              <a href="/privacy" className="text-[rgb(224,53,70)] hover:underline">
                Privacy Policy
              </a>
            </label>
          </div>
          <FieldError
            id="signup-terms-error"
            errors={errors.agreedToTerms ? [errors.agreedToTerms] : undefined}
            className="text-red-600"
          />
        </Field>

        <Button
          type="submit"
          disabled={isSubmitting || !agreedToTerms}
          className="h-11 w-full rounded-md bg-[rgb(224,53,70)] px-4 text-white hover:bg-[rgb(196,38,55)]"
        >
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </Button>
      </FieldGroup>
    </form>
  )
}
