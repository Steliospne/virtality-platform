import { describe, expect, it } from 'vitest'
import { MAX_ISSUES_PER_MESSAGE, parseTaskMessage } from './task-message.ts'

const plain = {
  assignee: undefined,
  priority: undefined,
  labels: [],
  status: undefined,
}

describe('parseTaskMessage', () => {
  it('uses the first line as title and the rest as description', () => {
    expect(parseTaskMessage('Fix login\n\nSpins forever\non Safari')).toEqual({
      kind: 'issues',
      issues: [
        {
          ...plain,
          title: 'Fix login',
          description: 'Spins forever\non Safari',
        },
      ],
    })
  })

  it('leaves description empty for a one-line message', () => {
    expect(parseTaskMessage('  Fix login  ')).toEqual({
      kind: 'issues',
      issues: [{ ...plain, title: 'Fix login', description: undefined }],
    })
  })

  it.each(['help', 'HELP', '?', '   ', '---'])(
    'treats %j as a help request',
    (text) => {
      expect(parseTaskMessage(text)).toEqual({ kind: 'help' })
    },
  )

  it('shortens an over-long title and keeps the full text', () => {
    const longLine = 'a'.repeat(250)
    const result = parseTaskMessage(`${longLine}\nmore`)

    expect(result.kind).toBe('issues')
    if (result.kind !== 'issues') return
    expect(result.issues[0]?.title).toHaveLength(200)
    expect(result.issues[0]?.title.endsWith('…')).toBe(true)
    expect(result.issues[0]?.description).toBe(`${longLine}\n\nmore`)
  })

  it('pulls assignee, priority and labels out of the title line', () => {
    expect(
      parseTaskMessage(
        'Fix login @eleni !high #bug #auth-flow\nSpins #forever',
      ),
    ).toEqual({
      kind: 'issues',
      issues: [
        {
          title: 'Fix login',
          description: 'Spins #forever',
          assignee: 'eleni',
          priority: 2,
          labels: ['bug', 'auth-flow'],
          status: undefined,
        },
      ],
    })
  })

  it.each([
    ['!urgent', 1],
    ['!HIGH', 2],
    ['!med', 3],
    ['!low', 4],
    ['!3', 3],
  ])('reads %s as priority %i', (token, priority) => {
    const result = parseTaskMessage(`Fix login ${token}`)

    expect(result.kind === 'issues' && result.issues[0]?.priority).toBe(
      priority,
    )
  })

  it('keeps words that only look like tokens in the title', () => {
    const result = parseTaskMessage('Crash on #123 at @ 5pm, wow!')

    expect(result).toEqual({
      kind: 'issues',
      issues: [
        {
          ...plain,
          title: 'Crash on #123 at @ 5pm, wow!',
          description: undefined,
        },
      ],
    })
  })

  it('reads options from a line of their own under the title', () => {
    expect(
      parseTaskMessage(
        'Check that the addressables are version agnostic\n@george !medium #bug /todo\ncheck also that they wont brake',
      ),
    ).toEqual({
      kind: 'issues',
      issues: [
        {
          title: 'Check that the addressables are version agnostic',
          description: 'check also that they wont brake',
          assignee: 'george',
          priority: 3,
          labels: ['bug'],
          status: 'todo',
        },
      ],
    })
  })

  it('takes the title from the first line that is not only options', () => {
    const result = parseTaskMessage('#bug !low\nFix login #auth\nSpins')

    expect(result).toEqual({
      kind: 'issues',
      issues: [
        {
          ...plain,
          title: 'Fix login',
          description: 'Spins',
          priority: 4,
          labels: ['bug', 'auth'],
        },
      ],
    })
  })

  it('keeps description lines that mix options with text', () => {
    const result = parseTaskMessage('Fix login\nsee #bug in @george notes')

    expect(result.kind === 'issues' && result.issues[0]).toEqual({
      ...plain,
      title: 'Fix login',
      description: 'see #bug in @george notes',
    })
  })

  it('explains a WhatsApp contact tag instead of a typed name', () => {
    expect(parseTaskMessage('Fix login\n@91934563557500 !medium')).toEqual({
      kind: 'invalid',
      problems: [
        "@91934563557500 is a WhatsApp contact, not a name. Type @name yourself without picking from WhatsApp's list.",
      ],
    })
  })

  it('splits issues on --- lines, including the phone em dash form', () => {
    const result = parseTaskMessage(
      'Fix login @eleni\nSpins forever\n---\nUpdate copy #docs\n—-\nThird one\n---\n',
    )

    expect(result).toEqual({
      kind: 'issues',
      issues: [
        {
          ...plain,
          title: 'Fix login',
          description: 'Spins forever',
          assignee: 'eleni',
        },
        {
          ...plain,
          title: 'Update copy',
          description: undefined,
          labels: ['docs'],
        },
        { ...plain, title: 'Third one', description: undefined },
      ],
    })
  })

  it('reports every problem, numbered by issue', () => {
    expect(
      parseTaskMessage('Fix login !soon\n---\n@a @b !high !low\n---\nFine'),
    ).toEqual({
      kind: 'invalid',
      problems: [
        'Issue 1: Unknown priority !soon. Use !urgent, !high, !medium or !low.',
        'Issue 2: Only one @assignee per issue.',
        'Issue 2: Only one !priority per issue.',
        'Issue 2: The issue needs a title.',
      ],
    })
  })

  it('rejects too many issues in one message', () => {
    const text = Array.from(
      { length: MAX_ISSUES_PER_MESSAGE + 1 },
      (_, index) => `Issue ${index}`,
    ).join('\n---\n')

    expect(parseTaskMessage(text).kind).toBe('invalid')
  })
})
