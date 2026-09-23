const MAX_TITLE_LENGTH = 200
export const MAX_ISSUES_PER_MESSAGE = 10

export const HELP_TEXT = [
  'Send a message to create a Linear issue:',
  '',
  'First line → title',
  'Everything after it → description',
  '',
  'On the title line you can add:',
  '@name → assignee',
  '!urgent !high !medium !low → priority',
  '#label → labels (as many as you like)',
  '',
  'Put a line with --- between issues to create several at once.',
  '',
  'Example:',
  'Console crashes when casting @eleni !high #bug',
  'Happens on Quest 3 after pairing a second headset.',
  '---',
  'Update onboarding copy #docs',
].join('\n')

export type IssuePriority = 1 | 2 | 3 | 4

// Linear's priority scale: 1 is the most urgent, 0 means none.
export const PRIORITY_NAMES: Record<IssuePriority, string> = {
  1: 'Urgent',
  2: 'High',
  3: 'Medium',
  4: 'Low',
}

const PRIORITY_WORDS: Record<string, IssuePriority> = {
  urgent: 1,
  high: 2,
  medium: 3,
  med: 3,
  low: 4,
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 4,
}

export type IssueDraft = {
  title: string
  description: string | undefined
  /** The `@handle` as typed, without the `@`. */
  assignee: string | undefined
  priority: IssuePriority | undefined
  /** `#label` names as typed, without the `#`. */
  labels: string[]
}

export type TaskMessage =
  | { kind: 'help' }
  | { kind: 'issues'; issues: IssueDraft[] }
  | { kind: 'invalid'; problems: string[] }

// A letter first, so `#123` and `@ 5pm` stay part of the title.
const ASSIGNEE_TOKEN = /^@(\p{L}[\p{L}\p{N}._-]*)$/u
const LABEL_TOKEN = /^#(\p{L}[\p{L}\p{N}_-]*)$/u
const PRIORITY_TOKEN = /^!([\p{L}\p{N}]+)$/u

// Phones turn `--` into an em dash, so `---` often arrives as `—-`.
const SEPARATOR_LINE = /^(?:—|[-–—]{2,})$/

function splitIssueBlocks(text: string) {
  const blocks: string[][] = [[]]
  for (const line of text.split('\n')) {
    if (SEPARATOR_LINE.test(line.trim())) blocks.push([])
    else blocks.at(-1)!.push(line)
  }
  return blocks
    .map((lines) => lines.join('\n').trim())
    .filter((block) => block.length > 0)
}

function parseIssueBlock(block: string) {
  const [firstLine = '', ...rest] = block.split('\n')
  const problems: string[] = []
  const assignees: string[] = []
  const priorities: IssuePriority[] = []
  const labels: string[] = []
  const titleWords: string[] = []

  for (const word of firstLine.trim().split(/\s+/)) {
    const assignee = ASSIGNEE_TOKEN.exec(word)?.[1]
    const label = LABEL_TOKEN.exec(word)?.[1]
    const priorityWord = PRIORITY_TOKEN.exec(word)?.[1]

    if (assignee) {
      assignees.push(assignee)
    } else if (label) {
      if (!labels.includes(label)) labels.push(label)
    } else if (priorityWord) {
      const priority = PRIORITY_WORDS[priorityWord.toLowerCase()]
      if (priority) priorities.push(priority)
      else {
        problems.push(
          `Unknown priority !${priorityWord}. Use !urgent, !high, !medium or !low.`,
        )
      }
    } else if (word) {
      titleWords.push(word)
    }
  }

  if (assignees.length > 1) problems.push('Only one @assignee per issue.')
  if (priorities.length > 1) problems.push('Only one !priority per issue.')

  const title = titleWords.join(' ')
  if (!title) problems.push('The first line needs a title.')

  const body = rest.join('\n').trim()
  const draft: IssueDraft = {
    title,
    description: body || undefined,
    assignee: assignees[0],
    priority: priorities[0],
    labels,
  }

  // An over-long first line is usually someone who wrote everything on one
  // line; keep a readable title and move the full text into the description.
  if (title.length > MAX_TITLE_LENGTH) {
    draft.title = `${title.slice(0, MAX_TITLE_LENGTH - 1).trimEnd()}…`
    draft.description = [title, body].filter(Boolean).join('\n\n')
  }

  return { draft, problems }
}

export function parseTaskMessage(text: string): TaskMessage {
  const blocks = splitIssueBlocks(text)

  if (
    blocks.length === 0 ||
    (blocks.length === 1 && /^(help|\?)$/i.test(blocks[0]!))
  ) {
    return { kind: 'help' }
  }

  if (blocks.length > MAX_ISSUES_PER_MESSAGE) {
    return {
      kind: 'invalid',
      problems: [
        `That's ${blocks.length} issues. Send at most ${MAX_ISSUES_PER_MESSAGE} per message.`,
      ],
    }
  }

  const parsed = blocks.map(parseIssueBlock)
  const problems = parsed.flatMap(({ problems }, index) =>
    blocks.length > 1
      ? problems.map((problem) => `Issue ${index + 1}: ${problem}`)
      : problems,
  )

  if (problems.length > 0) return { kind: 'invalid', problems }
  return { kind: 'issues', issues: parsed.map(({ draft }) => draft) }
}
