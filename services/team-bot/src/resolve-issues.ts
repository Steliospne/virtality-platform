import type { TeamDirectory, TeamLabel, TeamMember } from './linear/client.ts'
import type { IssueDraft, IssuePriority } from './task-message.ts'

const MAX_SUGGESTIONS = 20

export type ResolvedIssue = {
  title: string
  description: string | undefined
  assignee: TeamMember | undefined
  priority: IssuePriority | undefined
  labels: TeamLabel[]
}

export type ResolveResult =
  | { ok: true; issues: ResolvedIssue[] }
  | { ok: false; problems: string[] }

// What people type and what Linear stores differ in case, accents and
// punctuation, so compare letters and digits only: `#needs-design` matches
// "Needs design" and `@eleni` matches "Eléni".
function normalize(value: string) {
  return value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '')
}

function suggest(values: string[]) {
  const shown = values.slice(0, MAX_SUGGESTIONS).join(', ')
  return values.length > MAX_SUGGESTIONS ? `${shown}, …` : shown
}

/**
 * Handles are checked against the Linear username and email first, then the
 * first or full name, so a unique username wins over two people sharing a
 * first name.
 */
function findMembers(handle: string, members: TeamMember[]) {
  const wanted = normalize(handle)
  const byUsername = members.filter(
    (member) =>
      normalize(member.displayName) === wanted ||
      normalize(member.email.split('@')[0] ?? '') === wanted,
  )
  if (byUsername.length > 0) return byUsername

  return members.filter(
    (member) =>
      normalize(member.name) === wanted ||
      normalize(member.name.split(/\s+/)[0] ?? '') === wanted,
  )
}

/**
 * Turns typed `@handles` and `#labels` into Linear ids. Returns every problem
 * at once so the sender can fix the message in one go; nothing is created
 * unless all issues in the message resolve.
 */
export function resolveIssues(
  drafts: IssueDraft[],
  directory: TeamDirectory,
): ResolveResult {
  const problems: string[] = []
  const usernames = directory.members.map((member) => `@${member.displayName}`)
  const labelNames = directory.labels.map((label) => label.name)

  const issues = drafts.map((draft, index) => {
    const prefix = drafts.length > 1 ? `Issue ${index + 1}: ` : ''
    let assignee: TeamMember | undefined

    if (draft.assignee) {
      const matches = findMembers(draft.assignee, directory.members)
      if (matches.length === 1) {
        assignee = matches[0]
      } else if (matches.length === 0) {
        problems.push(
          `${prefix}No teammate called @${draft.assignee}. Try: ${suggest(usernames)}`,
        )
      } else {
        problems.push(
          `${prefix}@${draft.assignee} could be ${suggest(matches.map((member) => `@${member.displayName}`))}.`,
        )
      }
    }

    const labels: TeamLabel[] = []
    for (const typed of draft.labels) {
      const label = directory.labels.find(
        (candidate) => normalize(candidate.name) === normalize(typed),
      )
      if (!label) {
        problems.push(
          `${prefix}No label called #${typed}. Labels: ${suggest(labelNames)}`,
        )
      } else if (!labels.includes(label)) {
        labels.push(label)
      }
    }

    return {
      title: draft.title,
      description: draft.description,
      assignee,
      priority: draft.priority,
      labels,
    }
  })

  return problems.length > 0 ? { ok: false, problems } : { ok: true, issues }
}
