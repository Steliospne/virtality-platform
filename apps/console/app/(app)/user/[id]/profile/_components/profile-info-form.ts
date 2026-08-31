import { authClient } from '@/auth-client'
import { FieldMeta, getConsoleUrl } from '@virtality/shared/types'
import { UserSchema } from '@virtality/db/definitions'
import { useORPC } from '@virtality/react-query'
import z from 'zod/v4'
import {
  isValidPassword,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '@virtality/shared/utils'
import { type QueryClient } from '@tanstack/react-query'

export const baseURL = getConsoleUrl()

export type UserForm = Pick<
  z.infer<typeof UserSchema>,
  'name' | 'phoneNumber'
> & {
  image?: File | string | null
}

export const BasicInfoFormSchema = UserSchema.extend({
  image: z.instanceof(File).or(z.string()).optional().nullable(),
  phoneNumber: z.string().nullable(),
}).pick({ name: true, phoneNumber: true, image: true })

export type EmailForm = Pick<z.infer<typeof UserSchema>, 'email'>

export const EmailFormSchema = UserSchema.pick({ email: true })

export const PasswordFormSchema = z.object({
  currentPassword: z.string().nonempty('Current password is required').trim(),
  newPassword: z.string().trim().check(isValidPassword),
})

export const SetPasswordFormSchema = z.object({
  newPassword: z.string().trim().check(isValidPassword),
})

export type PasswordForm = z.infer<typeof PasswordFormSchema>
export type SetPasswordForm = z.infer<typeof SetPasswordFormSchema>

export const basicInfoFormFields = {
  image: {
    label: 'Image',
    description: 'Click on the photo to upload a custom one.',
    hint: 'The image will be used as your profile picture.',
  },
  name: {
    label: 'Name',
    placeholder: 'John Doe',
    description: 'Please enter your full name.',
    hint: 'Please use 32 characters at maximum.',
  },
  phoneNumber: {
    label: 'Phone Number',
    placeholder: '+1234567890',
    description: 'Please enter your phone number.',
    hint: 'A code will be sent to verify.',
  },
} satisfies FieldMeta<UserForm>

export const emailFormField = {
  email: {
    label: 'Email',
    placeholder: 'example@domain.com',
    description:
      'Your primary email will be used for account-related notifications.',
    hint: 'Emails must be verified to be used as primary email.',
  },
} satisfies FieldMeta<EmailForm>

export const passwordFormField = {
  currentPassword: {
    label: 'Current Password',
    placeholder: '********',
    description: 'Please enter your current password.',
    hint: 'Please enter your current password.',
  },
  newPassword: {
    label: 'New Password',
    placeholder: '********',
    description: 'Please enter your new password.',
    hint: 'Please enter your new password.',
  },
} satisfies FieldMeta<PasswordForm>

export type SessionUser = NonNullable<
  ReturnType<typeof authClient.useSession>['data']
>['user']

export const toFormValues = (user: SessionUser | undefined): UserForm => ({
  name: user?.name ?? '',
  phoneNumber: user?.phoneNumber ?? '',
  image: user?.image ?? null,
})

export const setPasswordFormField = {
  newPassword: {
    label: 'New Password',
    placeholder: '********',
    description: 'Choose a password for email and password sign-in.',
    hint: `Password must be ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters with upper, lower, and digit.`,
  },
} satisfies FieldMeta<SetPasswordForm>

export const invalidateActivePendingPasswordChange = async (
  queryClient: QueryClient,
  orpc: ReturnType<typeof useORPC>,
) => {
  await queryClient.invalidateQueries({
    queryKey: orpc.pendingPasswordChange.getActive.key(),
  })
}

export const invalidateActivePendingAccountDeletion = async (
  queryClient: QueryClient,
  orpc: ReturnType<typeof useORPC>,
) => {
  await queryClient.invalidateQueries({
    queryKey: orpc.pendingAccountDeletion.getActive.key(),
  })
}
