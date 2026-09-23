import type {
  TeamDirectory,
  TeamLabel,
  TeamMember,
  TeamStatus,
} from './linear/client.ts'
import type { IssueDraft, IssuePriority } from './task-message.ts'

const MAX_SUGGESTIONS = 20

export type ResolvedIssue = {
  title: string
  description: string | undefined
  assignee: TeamMember | undefined
  priority: IssuePriority | undefined
  labels: TeamLabel[]
  status: TeamStatus | undefined
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

// How to type a name after `/`: "In Progress" → "in-progress".
function slug(name: string) {
  return name.toLowerCase().trim().replace(/\s+/g, '-')
}

function suggest(values: string[]) {
  const shown = values.slice(0, MAX_SUGGESTIONS).join(', ')
  return values.length > MAX_SUGGESTIONS ? `${shown}, …` : shown
}

/**
 * Handles are checked against the Linear username and email name first,
 * then the first or full name, then the start of any of those. The first
 * step with any match wins, so a unique username beats two people sharing a
 * first name, and `@stelios` still finds "steliospnev".
 */
function findMembers(handle: string, members: TeamMember[]) {
  const wanted = normalize(handle)
  const usernames = (member: TeamMember) => [
    normalize(member.displayName),
    normalize(member.email.split('@')[0] ?? ''),
  ]
  const names = (member: TeamMember) => [
    normalize(member.name),
    normalize(member.name.split(/\s+/)[0] ?? ''),
  ]
  const steps = [
    (member: TeamMember) => usernames(member).includes(wanted),
    (member: TeamMember) => names(member).includes(wanted),
    (member: TeamMember) =>
      [...usernames(member), ...names(member)].some((name) =>
        name.startsWith(wanted),
      ),
  ]

  for (const matches of steps) {
    const found = members.filter(matches)
    if (found.length > 0) return found
  }
  return []
}

/** Exact name first, then the start of one, so `/in-prog` finds "In Progress". */
function findStatuses(typed: string, statuses: TeamStatus[]) {
  const wanted = normalize(typed)
  const exact = statuses.filter((status) => normalize(status.name) === wanted)
  if (exact.length > 0) return exact
  return statuses.filter((status) => normalize(status.name).startsWith(wanted))
}

/**
 * Turns typed `@handles`, `#labels` and `/statuses` into Linear ids. Returns every problem
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
  const statusNames = directory.statuses.map(
    (status) => `/${slug(status.name)}`,
  )

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

    let status: TeamStatus | undefined
    if (draft.status) {
      const matches = findStatuses(draft.status, directory.statuses)
      if (matches.length === 1) {
        status = matches[0]
      } else {
        problems.push(
          matches.length === 0
            ? `${prefix}No status called /${draft.status}. Statuses: ${suggest(statusNames)}`
            : `${prefix}/${draft.status} could be ${suggest(matches.map((match) => `/${slug(match.name)}`))}.`,
        )
      }
    }

    return {
      title: draft.title,
      description: draft.description,
      assignee,
      priority: draft.priority,
      labels,
      status,
    }
  })

  return problems.length > 0 ? { ok: false, problems } : { ok: true, issues }
}
