import type { User } from '@/auth-client'
import type { Member } from '@virtality/db'
import { z } from 'zod/v4'
import { isValidNumber, isValidPassword } from './utils'

export const RoleEnum = z.enum(['admin', 'owner', 'user', 'employee'])

export type Role = z.infer<typeof RoleEnum>

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z
    .string()
    .min(1, { message: 'Email cannot be empty' })
    .email({ message: 'Provide valid email example@domain.com' }),
  image: z.string().nullable().optional(),
  phoneNumber: z
    .string()
    .max(15, { message: 'Phone number cannot be more than 15 digits' })
    .nullable(),
})

export const UserProfileSchema = z
  .object({
    name: z
      .string()
      .min(1, { message: 'Name cannot be empty' })
      .max(32, { message: 'Name cannot be more than 32 characters' }),
    email: z.email({ message: 'Provide valid email example@domain.com' }),
    // image: z.string().nullable().optional(),
    phoneNumber: z
      .string()
      .max(15, { message: 'Phone number cannot be more than 15 digits' })
      .nullable(),
  })
  .superRefine((data, ctx) => {})

export type UserProfile = z.infer<typeof UserProfileSchema>

export const SignInSchema = z.object({
  email: z.email({ message: '• Provide valid email example@domain.com' }),
  password: z.string().min(1, { message: '• Password cannot be empty' }),
})

export type SignInForm = z.infer<typeof SignInSchema>

export const SignUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: '• Name cannot be empty.' })
    .max(32, { message: '• Name cannot be more than 32 characters.' }),
  email: z.email({ message: '• Provide valid email example@domain.com' }),
  password: z.string().check(isValidPassword),
})

export type SignUpForm = z.infer<typeof SignUpSchema>

export const ExerciseSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string(),
  category: z.string(),
  direction: z.string(),
  image: z.url().nullable(),
  bodyPart: z.string(),
  item: z.string().nullable(),
})

export const ExerciseArraySchema = z.array(ExerciseSchema)

export const SessionExerciseSchema = z.object({
  id: z.string(),
  exerciseId: z.string(),
  patientSessionId: z.string(),
  reps: z.number(),
  sets: z.number(),
  restTime: z.number(),
  holdTime: z.number(),
  speed: z.number(),
})

export const SessionExerciseArraySchema = z.array(SessionExerciseSchema)

export const PatientFormSchema = z.object({
  name: z.string().nonempty('Name is required'),
  weight: z
    .string()
    .refine(isValidNumber, {
      message: 'Weight must be a positive number',
    })
    .optional(),
  height: z
    .string()
    .refine(isValidNumber, {
      message: 'Height must be a positive number',
    })
    .optional(),
  phone: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => {
        if (!val) return true
        return val.length >= 10 && val.length <= 15
      },
      {
        message: 'Phone number must be between 10 and 15 digits',
      },
    ),
  email: z.string().refine(
    (val) => {
      if (!val) return true

      if (z.regexes.email.test(val)) return true
      else return false
    },
    {
      message: 'Invalid email format',
    },
  ),
  dob: z.string().optional(),
  sex: z.string().optional(),
  image: z.instanceof(File).or(z.string()).optional().nullable(),
  language: z.enum(['Greek', 'English']).optional(),
  occupation: z.string().optional(),
  // medical history
  anamneses: z.string().nullable(),
  complaints: z.string().nullable(),
  expectations: z.string().nullable(),
  diagnosis: z.string().nullable(),
  nprs: z.string().nullable(),
})

export type PatientForm = z.infer<typeof PatientFormSchema>

export const DeviceSchema = z.object({
  id: z.string(),
  deviceId: z.string().nullable(),
  userId: z.string(),
  name: z
    .string()
    .min(1, { message: 'Name cannot be empty.' })
    .max(32, { message: 'Name too long.' }),
  model: z.string().nonempty('Select a model.').nullable(),
  lastUsed: z.date(),
  createdAt: z.date(),
  deletedAt: z.date().nullable(),
})

export const ProgressDataSchema = z.object({
  previousRep: z.number(),
  progress: z.number(),
})

export type ProgressData = z.infer<typeof ProgressDataSchema>

export const BugReportFormSchema = z.object({
  title: z.string().min(2, { message: 'Title must be at least 2 characters.' }),
  platform: z.enum(['web', 'vr'], { message: 'Please select a platform.' }),
  description: z
    .string()
    .min(10, { message: 'Description must be at least 10 characters.' })
    .max(500, { message: 'Description must not exceed 500 characters.' }),
  image: z.array(z.instanceof(File)).or(z.string()).optional().nullable(),
})

export type BugReportForm = z.infer<typeof BugReportFormSchema>

export const OrganizationSchema = z.object({
  id: z.string().default(''),
  name: z.string(),
  slug: z.string(),
  logo: z.optional(z.optional(z.string().nullable())),
  metadata: z.optional(
    z
      .union([
        z.record(z.string(), z.string()),
        z.string().transform((val) => val),
      ])
      .nullable(),
  ),
  createdAt: z.date(),
})

export interface Organization extends z.infer<typeof OrganizationSchema> {
  isFrozen: boolean | null
}

export const OrganizationMemberSchema = z.object({
  id: z.string().optional(),
  name: z.string().nullable().optional(),
  role: z.string(),
  image: z.string().nullable(),
  createdAt: z.date().optional(),
})

export type OrganizationMember = z.infer<typeof OrganizationMemberSchema>

export type OrganizationWithMembers = Organization & {
  members: (Member & { user: User })[]
}
