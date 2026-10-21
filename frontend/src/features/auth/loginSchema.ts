import { z } from 'zod'

export const loginSchema = z.object({
  phone: z
    .string()
    .trim()
    .superRefine((phone, context) => {
      if (!phone) {
        context.addIssue({
          code: 'custom',
          message: 'Please enter phone number',
        })
      } else if (!/^\d{10}$/.test(phone)) {
        context.addIssue({
          code: 'custom',
          message: 'Invalid Phone Number',
        })
      }
    }),
})

export type LoginFormValues = z.infer<typeof loginSchema>