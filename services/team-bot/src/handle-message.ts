import type { AppLogger } from '@virtality/shared/observability'
import type { CreatedIssue, LinearClient } from './linear/client.ts'
import type { SeenMessages } from './seen-messages.ts'
import {
  type ResolvedIssue,
  type ResolveResult,
  resolveIssues,
} from './resolve-issues.ts'
import { HELP_TEXT, parseTaskMessage, PRIORITY_NAMES } from './task-message.ts'
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

type CreateResult = {
  issue: ResolvedIssue
  created: CreatedIssue | undefined
}

function formatProblems(problems: string[]) {
  return [
    'Nothing was created. Fix this and send it again:',
    '',
    ...problems.map((problem) => `• ${problem}`),
  ].join('\n')
}

function formatIssue(issue: ResolvedIssue, created: CreatedIssue) {
  const details = [
    issue.assignee?.name,
    issue.priority && PRIORITY_NAMES[issue.priority],
    ...issue.labels.map((label) => label.name),
  ].filter(Boolean)

  return [
    `${created.identifier}: ${issue.title}`,
    ...(details.length > 0 ? [details.join(' · ')] : []),
    created.url,
  ].join('\n')
}

function formatResults(results: CreateResult[]) {
  const created = results.filter(
    (result): result is CreateResult & { created: CreatedIssue } =>
      result.created !== undefined,
  )
  const failed = results.filter((result) => result.created === undefined)

  if (created.length === 0) {
    return results.length === 1
      ? "Couldn't create the Linear issue. Please try again."
      : "Couldn't create the Linear issues. Please try again."
  }

  const sections =
    results.length === 1
      ? [`Created ${formatIssue(created[0]!.issue, created[0]!.created)}`]
      : [
          `Created ${created.length} of ${results.length} issues:`,
          ...created.map(({ issue, created }) => formatIssue(issue, created)),
        ]

  if (failed.length > 0) {
    sections.push(
      [
        "Couldn't create these, send them again:",
        ...failed.map(({ issue }) => `• ${issue.title}`),
      ].join('\n'),
    )
  }

  return sections.join('\n\n')
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

  const parsed = parseTaskMessage(message.text)

  if (parsed.kind === 'help') {
    await reply(HELP_TEXT)
    return
  }

  if (parsed.kind === 'invalid') {
    await reply(formatProblems(parsed.problems))
    return
  }

  // Only look people and labels up when the message uses them.
  const needsDirectory = parsed.issues.some(
    (draft) => draft.assignee || draft.labels.length > 0,
  )
  let resolved: ResolveResult

  try {
    resolved = resolveIssues(
      parsed.issues,
      needsDirectory
        ? await deps.linear.getTeamDirectory()
        : { members: [], labels: [] },
    )
  } catch (error) {
    logger.error('team_bot.directory.failed', { messageId: message.id, error })
    await reply("Couldn't reach Linear. Please try again.")
    return
  }

  if (!resolved.ok) {
    await reply(formatProblems(resolved.problems))
    return
  }

  // One at a time, so the issue numbers follow the order in the message.
  const results: CreateResult[] = []
  for (const issue of resolved.issues) {
    try {
      const created = await deps.linear.createIssue({
        title: issue.title,
        description: withReporter(issue.description, message.senderName),
        assigneeId: issue.assignee?.id,
        priority: issue.priority,
        labelIds: issue.labels.map((label) => label.id),
      })

      logger.info('team_bot.issue.created', {
        messageId: message.id,
        issue: created.identifier,
      })
      results.push({ issue, created })
    } catch (error) {
      logger.error('team_bot.issue.failed', { messageId: message.id, error })
      results.push({ issue, created: undefined })
    }
  }

  await reply(formatResults(results))
}
