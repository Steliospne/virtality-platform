import { ContactFormSchema, WaitlistFormSchema } from '@/lib/definitions'
import { z } from 'zod/v4'

export interface WaitlistFormType extends z.infer<typeof WaitlistFormSchema> {
  plan?: string
}

export type ContactForm = z.infer<typeof ContactFormSchema>

export type SlackMessage = {
  text: string
  blocks: (
    | {
        type: string
        text: {
          type: string
          text: string
        }
        fields?: undefined
      }
    | {
        type: string
        fields: {
          type: string
          text: string
        }[]
        text?: undefined
      }
  )[]
}
