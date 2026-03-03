import type { User } from '@virtality/db'

export type EmailData = {
  user: Pick<
    User,
    'email' | 'name' | 'id' | 'createdAt' | 'updatedAt' | 'emailVerified'
  > & { image?: string | null }
  url: string
  token: string
}
