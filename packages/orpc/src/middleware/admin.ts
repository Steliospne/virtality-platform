import { ORPCError } from '@orpc/server'
import { base } from '../context.ts'
import { requireAuth } from './auth.ts'

export function assertAdminRole(role: string | null | undefined): void {
  if (role !== 'admin') {
    throw new ORPCError('FORBIDDEN')
  }
}

export const requireAdminRole = base.middleware(async ({ context, next }) => {
  assertAdminRole(context.user?.role)
  return next()
})

export const adminAuthed = base.use(requireAuth).use(requireAdminRole)
