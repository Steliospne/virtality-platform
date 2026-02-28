import { z } from 'zod/v4'

const isValidNumber = (value: string | null | undefined) => {
  const isUndefined = value === undefined
  const isValueNaN = isNaN(Number(value))
  const isEmptyString = value === ''
  const isPositive = Number(value) >= 0

  return isEmptyString || (!isUndefined && !isValueNaN && isPositive)
}

export const ExerciseSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string(),
  category: z.string(),
  direction: z.string(),
  image: z.string().nullable(),
  bodyPart: z.string(),
  item: z.string().nonempty(),
})

export const ExerciseArraySchema = z.array(ExerciseSchema)

export const AvatarSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string().nullable(),
})

export const AvatarArraySchema = z.array(AvatarSchema)

export const MapSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string().nullable(),
})

export const MapArraySchema = z.array(MapSchema)

export const UserSchema = z.object({
  id: z.string().nonempty(),
  name: z.string().nonempty(),
  createdAt: z.date(),
  updatedAt: z.date(),
  email: z.string().nonempty(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  phone: z.string().nullable(),
  stripeCustomerId: z.string().nullable(),
  role: z.string().nullable(),
  banned: z.boolean().nullable(),
  banReason: z.string().nullable(),
  banExpires: z.date().nullable(),
})

export const UserArraySchema = z.array(UserSchema)

export const PatientSchema = z.object({
  name: z.string().nonempty(),
  id: z.string().nonempty(),
  userId: z.string().nullable(),
  email: z.string().nullable(),
  dob: z.string().nullable(),
  sex: z.string().nullable(),
  weight: z.string().nullable(),
  height: z.string().nullable(),
  phone: z.string().nullable(),
  image: z.string().nullable(),
  avatarId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const PatientArraySchema = z.array(PatientSchema)

export const LoginFormSchema = z.object({
  email: z.email().trim(),
  password: z.string().trim().min(1, { error: 'Password cannot be empty' }),
})

const NewUserFormBaseSchema = z.object({
  name: z.string().min(1, { error: 'Field cannot be empty' }),
  email: z.email().trim(),
  password: z.string().trim().min(1, { error: 'Field cannot be empty' }),
  passwordConf: z.string().trim().min(1, { error: 'Field cannot be empty' }),
  role: z.enum(['user', 'admin']),
})

export const NewUserFormSchema = NewUserFormBaseSchema.refine(
  (data) => data.password === data.passwordConf,
  {
    error: "Passwords don't match",
    path: ['passwordConf'],
    when(payload) {
      return NewUserFormBaseSchema.pick({
        password: true,
        passwordConf: true,
      }).safeParse(payload.value).success
    },
  },
)

export const PresetFormSchema = z.object({
  presetName: z.string().nonempty('Name cannot be empty.'),
  pathology: z.string().nonempty('Pathology cannot be empty.'),
  start: z.string().nullable().refine(isValidNumber, {
    message: 'Must be a positive number',
  }),
  end: z.string().nullable().refine(isValidNumber, {
    message: 'Must be a positive number',
  }),
  description: z.string().nullable(),
})

export const ImageUploadForm = z.object({
  image: z.file().or(z.string()).optional(),
})
