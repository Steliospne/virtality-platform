import { prisma } from '@virtality/db'
import {
  shouldShowTrialWelcome,
  TRIAL_WELCOME_PATH,
} from '@virtality/shared/utils'

export { TRIAL_WELCOME_PATH }

export function isTrialWelcomePath(pathname: string): boolean {
  return (
    pathname === TRIAL_WELCOME_PATH ||
    pathname.startsWith(`${TRIAL_WELCOME_PATH}/`)
  )
}

export async function clinicianNeedsTrialWelcome(input: {
  userId: string
  role: string | null | undefined
  now?: Date
}): Promise<boolean> {
  if (input.role === 'admin' || input.role === 'tester') return false

  const accessGate = await prisma.accessGrant.findFirst({
    where: { userId: input.userId, status: 'trialing' },
    orderBy: { createdAt: 'desc' },
    select: {
      status: true,
      trialStart: true,
      trialEnd: true,
      hasSeenWelcome: true,
    },
  })

  return shouldShowTrialWelcome({
    role: input.role,
    accessGate,
    hasSeenWelcome: accessGate?.hasSeenWelcome,
    now: input.now,
  })
}
