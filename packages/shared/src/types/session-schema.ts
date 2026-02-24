import { z } from 'zod'

export const PatientSessionSchema = z
  .object({
    methods: z.array(z.string()).default([]),
    otherEnabled: z.boolean().default(false),
    otherText: z.string().optional(),
  })
  .refine((data) => !data.otherEnabled || !!data.otherText?.trim(), {
    message: 'Please specify the other method',
    path: ['otherText'],
  })

export type PatientSessionForm = z.infer<typeof PatientSessionSchema>

export const SessionNotesSchema = z.object({ notes: z.string() })

export type SessionNotes = z.infer<typeof SessionNotesSchema>
