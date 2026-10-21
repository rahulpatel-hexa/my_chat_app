import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginFormValues } from '../loginSchema'

import { Button } from '@/components/ui/button'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'

type LoginFormProps = {
  onSubmit: (values: LoginFormValues) => void | Promise<void>
  initialPhone?: string
}

export default function LoginForm({ onSubmit, initialPhone = '' }: LoginFormProps) {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: initialPhone },
  })
  const { errors, isSubmitting } = form.formState
  const phoneRegistration = form.register('phone')

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup className="gap-5">
        <Field data-invalid={Boolean(errors.phone)}>
          <FieldLabel htmlFor="phone">Phone number</FieldLabel>
          <div
            // className={`flex h-11 items-center rounded-md border bg-white focus-within:ring-2 ${
            //   errors.phone
            //     ? 'border-red-600 focus-within:ring-red-600/20'
            //     : 'border-gray-300 focus-within:ring-gray-300/50'
            // }`}

            className={`flex h-11 items-center rounded-md border bg-white ${errors.phone
                ? 'border-red-600'
                : 'border-gray-300'
              }`}
          >
            <span
              className="select-none border-r border-gray-300 px-3 text-gray-600"
              aria-label="Country calling code India"
            >
              +91
            </span>
            <Input
              id="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={10}
              placeholder="98765 43210"
              aria-label="10-digit phone number"
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? 'phone-error' : undefined}
              // className="h-full min-w-0 flex-1 !rounded-none !border-0 bg-transparent px-3 text-gray-900 !shadow-none !outline-none focus:!border-0 focus:!shadow-none focus:!outline-none focus-visible:!border-0 focus-visible:!ring-0 focus-visible:!outline-none"

              className="h-full min-w-0 flex-1 !rounded-none !border-0 !bg-transparent px-3 text-gray-900 !shadow-none !outline-none !ring-0 focus:!border-0 focus:!shadow-none focus:!outline-none focus:!ring-0 focus-visible:!border-0 focus-visible:!shadow-none focus-visible:!outline-none focus-visible:!ring-0"
              {...phoneRegistration}
              onChange={(event) => {
                event.currentTarget.value = event.currentTarget.value.replace(/\D/g, '').slice(0, 10)
                void phoneRegistration.onChange(event)
              }}
            />
          </div>
          <FieldError
            id="phone-error"
            errors={errors.phone ? [errors.phone] : undefined}
            className="text-red-600"
          />
        </Field>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-11 w-full rounded-md bg-[rgb(224,53,70)] px-4 text-white hover:bg-[rgb(196,38,55)]"
        >
          {isSubmitting ? 'Sending OTP...' : 'Send OTP'}
        </Button>
      </FieldGroup>
    </form>
  )
}