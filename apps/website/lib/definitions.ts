import { z } from 'zod/v4'

export const WaitlistFormSchema = z.object({
  email: z.email({
    message: 'Provide valid email example@domain.com',
  }),
})

export const ContactFormSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, { message: 'First name cannot be empty.' })
    .max(20, { message: 'Name cannot be more than 20 characters.' }),
  lastName: z
    .string()
    .trim()
    .min(1, { message: 'Last name cannot be empty.' })
    .max(20, { message: 'Name cannot be more than 20 characters.' }),
  email: z.email({ message: 'Provide valid email example@domain.com' }),
  phone: z.string().refine(
    (value) => {
      if (!value) return true
      return value.length >= 9 && value.length <= 15
    },
    {
      message: 'Phone number must be between 9 and 15 digits.',
    },
  ),
  message: z
    .string()
    .trim()
    .min(1, { message: 'Message field cannot be empty.' }),
})
