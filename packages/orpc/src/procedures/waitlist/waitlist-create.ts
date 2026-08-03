import type { SendWaitlistNotificationInput } from '@virtality/nodemailer'
import type { WaitlistSchemaType } from '@virtality/shared/types'
import type { AppLogger } from '@virtality/shared/observability'

export type WaitlistNotifyLogger = Pick<AppLogger, 'info' | 'warn'>

export const DEFAULT_WAITLIST_NOTIFY_EMAIL = 'info@virtality.app'

export type CreateWaitlistDeps = {
  prisma: {
    waitingList: {
      findFirst: (args: {
        where: { email: string }
      }) => Promise<{ id: string; email: string } | null>
      create: (args: {
        data: {
          id: string
          email: string
          createdAt: Date
          plan?: string | null
        }
      }) => Promise<unknown>
    }
  }
  generateId: () => string
  now: () => Date
  getNotifyRecipient: () => string | undefined
  sendWaitlistNotification: (
    input: SendWaitlistNotificationInput,
  ) => Promise<void>
  logger: WaitlistNotifyLogger
}

export type CreateWaitlistResult =
  | { success: true; message: null }
  | { success: false; message: string }

export type NotifyWaitlistTeamDeps = Pick<
  CreateWaitlistDeps,
  'getNotifyRecipient' | 'sendWaitlistNotification' | 'logger'
>

export function getWaitlistNotifyRecipient(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const additionalRecipients =
    env.WAITLIST_NOTIFY_EMAIL?.split(',')
      .map((email) => email.trim())
      .filter(Boolean) ?? []

  return [
    ...new Set([DEFAULT_WAITLIST_NOTIFY_EMAIL, ...additionalRecipients]),
  ].join(', ')
}

export async function notifyWaitlistTeam(
  deps: NotifyWaitlistTeamDeps,
  input: { email: string },
): Promise<'sent' | 'skipped'> {
  const recipient = deps.getNotifyRecipient()

  if (!recipient) {
    deps.logger.warn('waitlist.notify.skipped', {
      reason: 'WAITLIST_NOTIFY_EMAIL not configured',
    })
    return 'skipped'
  }

  await deps.sendWaitlistNotification({
    recipient,
    email: input.email,
  })
  deps.logger.info('waitlist.notify.sent', {
    recipient,
  })
  return 'sent'
}

export async function createWaitlistEntry(
  deps: CreateWaitlistDeps,
  input: WaitlistSchemaType,
): Promise<CreateWaitlistResult> {
  const exists = await deps.prisma.waitingList.findFirst({
    where: { email: input.email },
  })

  if (exists) {
    return { success: false, message: 'You are already on the waitlist.' }
  }

  await deps.prisma.waitingList.create({
    data: {
      id: deps.generateId(),
      ...input,
      createdAt: deps.now(),
    },
  })

  await notifyWaitlistTeam(deps, { email: input.email })

  return { success: true, message: null }
}
