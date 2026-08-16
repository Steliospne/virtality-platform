/** Local-only admin used by onboarding seeds. Never use in production. */
export const DEV_ADMIN = {
  userId: 'a0000000-0000-4000-8000-000000000001',
  accountId: 'a0000000-0000-4000-8000-000000000002',
  email: 'dev@virtality.local',
  password: 'password',
  name: 'Local Dev Admin',
  role: 'admin',
} as const
