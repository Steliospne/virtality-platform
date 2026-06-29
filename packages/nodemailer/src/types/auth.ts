import type { User } from '@virtality/db'

type StriptedUser = Pick<
  User,
  'email' | 'name' | 'id' | 'createdAt' | 'updatedAt' | 'emailVerified'
> & { image?: string | null }

export type EmailData = {
  user: StriptedUser
  url: string
  token: string
}

export type ChangeEmailData = {
  user: StriptedUser
  newEmail: string
  url: string
  token: string
}

export type PendingPasswordChangeData = {
  user: StriptedUser
  url: string
  variant: 'setup' | 'change'
}
