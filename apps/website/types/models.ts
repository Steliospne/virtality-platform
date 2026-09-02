import { ContactFormSchema, WaitlistFormSchema } from '@/lib/definitions'
import { z } from 'zod/v4'

export interface WaitlistFormType extends z.infer<typeof WaitlistFormSchema> {
  plan?: string
}

export type ContactForm = z.infer<typeof ContactFormSchema>
