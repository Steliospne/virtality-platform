const MAX_TITLE_LENGTH = 200
export const MAX_ISSUES_PER_MESSAGE = 10

export const HELP_TEXT = [
  'Send a message to create a Linear issue:',
  '',
  'First line → title',
  'Everything after it → description',
  '',
  'Options, on the title line or a line of their own:',
  '@name → assignee',
  '!urgent !high !medium !low → priority',
  '#label → labels (as many as you like)',
  '/status → status, e.g. /todo or /in-progress',
  '',
  "Type @name yourself; don't pick a contact from WhatsApp's list.",
  '',
  'Put a line with --- between issues to create several at once.',
  '',
  'Example:',
  'Console crashes when casting',
  '@george !high #bug /todo',
  'Happens on Quest 3 after pairing a second headset.',
  '---',
  'Update onboarding copy #improvement',
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
  /** The `/status` as typed, without the `/`. */
  status: string | undefined
}

export type TaskMessage =
  | { kind: 'help' }
  | { kind: 'issues'; issues: IssueDraft[] }
  | { kind: 'invalid'; problems: string[] }

type IssueOption =
  | { kind: 'assignee'; value: string }
  | { kind: 'priority'; value: IssuePriority }
  | { kind: 'label'; value: string }
  | { kind: 'status'; value: string }
  | { kind: 'problem'; value: string }

// A letter first, so `#123` and `@ 5pm` stay plain text.
const ASSIGNEE_TOKEN = /^@(\p{L}[\p{L}\p{N}._-]*)$/u
const LABEL_TOKEN = /^#(\p{L}[\p{L}\p{N}_-]*)$/u
const PRIORITY_TOKEN = /^!([\p{L}\p{N}]+)$/u
const STATUS_TOKEN = /^\/(\p{L}[\p{L}\p{N}_-]*)$/u
// Picking a contact from WhatsApp's @ list sends an internal id, not a name.
const CONTACT_TAG = /^@\d{5,}$/

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

function parseOption(word: string): IssueOption | undefined {
  const assignee = ASSIGNEE_TOKEN.exec(word)?.[1]
  if (assignee) return { kind: 'assignee', value: assignee }

  const label = LABEL_TOKEN.exec(word)?.[1]
  if (label) return { kind: 'label', value: label }

  const status = STATUS_TOKEN.exec(word)?.[1]
  if (status) return { kind: 'status', value: status }

  const priorityWord = PRIORITY_TOKEN.exec(word)?.[1]
  if (priorityWord) {
    const priority = PRIORITY_WORDS[priorityWord.toLowerCase()]
    return priority
      ? { kind: 'priority', value: priority }
      : {
          kind: 'problem',
          value: `Unknown priority !${priorityWord}. Use !urgent, !high, !medium or !low.`,
        }
  }

  if (CONTACT_TAG.test(word)) {
    return {
      kind: 'problem',
      value: `${word} is a WhatsApp contact, not a name. Type @name yourself without picking from WhatsApp's list.`,
    }
  }

  return undefined
}

function readLine(line: string) {
  const options: IssueOption[] = []
  const words: string[] = []

  for (const word of line.trim().split(/\s+/)) {
    if (!word) continue
    const option = parseOption(word)
    if (option) options.push(option)
    else words.push(word)
  }

  return { options, words }
}

function parseIssueBlock(block: string) {
  const options: IssueOption[] = []
  const textLines: string[] = []

  // A line of nothing but options is taken out wherever it sits, so options
  // can go under the title instead of on it.
  for (const line of block.split('\n')) {
    const read = readLine(line)
    if (read.options.length > 0 && read.words.length === 0) {
      options.push(...read.options)
    } else {
      textLines.push(line)
    }
  }

  const titleIndex = textLines.findIndex((line) => line.trim())
  const titleLine = readLine(textLines[titleIndex] ?? '')
  options.push(...titleLine.options)

  const pick = <K extends IssueOption['kind']>(kind: K) =>
    options
      .filter((option) => option.kind === kind)
      .map(
        (option) => option.value as Extract<IssueOption, { kind: K }>['value'],
      )

  const assignees = pick('assignee')
  const priorities = pick('priority')
  const statuses = pick('status')
  const problems = pick('problem')

  if (assignees.length > 1) problems.push('Only one @assignee per issue.')
  if (priorities.length > 1) problems.push('Only one !priority per issue.')
  if (statuses.length > 1) problems.push('Only one /status per issue.')

  const title = titleLine.words.join(' ')
  if (!title) problems.push('The issue needs a title.')

  const body = textLines
    .slice(titleIndex + 1)
    .join('\n')
    .trim()
  const draft: IssueDraft = {
    title,
    description: body || undefined,
    assignee: assignees[0],
    priority: priorities[0],
    labels: [...new Set(pick('label'))],
    status: statuses[0],
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
