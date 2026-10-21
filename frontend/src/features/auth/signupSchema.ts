import { z } from 'zod'

export const signupSchema = z.object({
  fullName: z.string().trim().refine(
    (name) =>
      /[\p{L}\p{M}]/u.test(name) &&
      /^[\p{L}\p{M} .'-]+$/u.test(name),
    'Please enter a valid name',
  ),
  email: z.string().trim().superRefine((email, context) => {
    if (!email) {
      context.addIssue({
        code: 'custom',
        message: 'Please enter an email',
      })
    } else if (!z.email().safeParse(email).success) {
      context.addIssue({
        code: 'custom',
        message: 'Invalid Email Id',
      })
    }
  }),
  agreedToTerms: z.boolean(),
})

export type SignupFormValues = z.infer<typeof signupSchema>
