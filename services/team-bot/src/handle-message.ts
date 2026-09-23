import type { AppLogger } from '@virtality/shared/observability'
import type { LinearClient } from './linear/client.ts'
import type { SeenMessages } from './seen-messages.ts'
import { HELP_TEXT, parseTaskMessage } from './task-message.ts'
import type { WhatsAppClient } from './whatsapp/client.ts'
import type { IncomingMessage } from './whatsapp/webhook-payload.ts'

export type MessageHandlerDeps = {
  phoneNumberId: string
  allowedSenders: ReadonlySet<string>
  seenMessages: SeenMessages
  linear: LinearClient
  whatsapp: WhatsAppClient
  logger: Pick<AppLogger, 'info' | 'warn' | 'error'>
}

function withReporter(description: string | undefined, senderName?: string) {
  const footer = `_Reported via WhatsApp${senderName ? ` by ${senderName}` : ''}_`
  return description ? `${description}\n\n${footer}` : footer
}

export async function handleIncomingMessage(
  message: IncomingMessage,
  deps: MessageHandlerDeps,
) {
  const { logger } = deps

  // One Meta app can serve several numbers; only answer for ours.
  if (message.phoneNumberId !== deps.phoneNumberId) return
  if (!deps.seenMessages.markSeen(message.id)) return

  // Anyone with the number can message it. Stay silent to strangers so the
  // bot does not confirm it exists.
  if (!deps.allowedSenders.has(message.from)) {
    logger.warn('team_bot.sender.rejected', { messageId: message.id })
    return
  }

  const reply = (body: string) =>
    deps.whatsapp.replyText({
      to: message.from,
      body,
      replyToMessageId: message.id,
    })

  if (message.type !== 'text' || !message.text) {
    await reply('I can only read text messages for now.\n\n' + HELP_TEXT)
    return
  }

  const task = parseTaskMessage(message.text)

  if (task.kind === 'help') {
    await reply(HELP_TEXT)
    return
  }

  try {
    const issue = await deps.linear.createIssue({
      title: task.title,
      description: withReporter(task.description, message.senderName),
    })

    logger.info('team_bot.issue.created', {
      messageId: message.id,
      issue: issue.identifier,
    })
    await reply(`Created ${issue.identifier}: ${task.title}\n${issue.url}`)
  } catch (error) {
    logger.error('team_bot.issue.failed', { messageId: message.id, error })
    await reply("Couldn't create the Linear issue. Please try again.")
  }
}
