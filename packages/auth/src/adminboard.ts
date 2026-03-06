import { betterAuth } from 'better-auth'
import { core_auth } from './core-auth.ts'

export const auth = betterAuth({
  ...core_auth,
})
