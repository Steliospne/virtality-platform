import { describe, expect, it } from 'vitest'
import { resolveIssues } from './resolve-issues.ts'
import type { IssueDraft } from './task-message.ts'

const eleni = {
  id: 'u1',
  name: 'Eléni Papadopoulou',
  displayName: 'eleni',
  email: 'eleni@virtality.app',
}
const nikos = {
  id: 'u2',
  name: 'Nikos Georgiou',
  displayName: 'ngeorgiou',
  email: 'n.georgiou@virtality.app',
}
const nikosK = {
  id: 'u3',
  name: 'Nikos Kostas',
  displayName: 'nkostas',
  email: 'nk@virtality.app',
}
const bug = { id: 'l1', name: 'Bug' }
const needsDesign = { id: 'l2', name: 'Needs design' }

const directory = {
  members: [eleni, nikos, nikosK],
  labels: [bug, needsDesign],
}

function draft(overrides?: Partial<IssueDraft>): IssueDraft {
  return {
    title: 'Fix login',
    description: undefined,
    assignee: undefined,
    priority: undefined,
    labels: [],
    ...overrides,
  }
}

describe('resolveIssues', () => {
  it('matches handles and labels loosely', () => {
    expect(
      resolveIssues(
        [
          draft({
            assignee: 'Eleni',
            priority: 2,
            labels: ['bug', 'needs-design', 'BUG'],
          }),
        ],
        directory,
      ),
    ).toEqual({
      ok: true,
      issues: [
        {
          title: 'Fix login',
          description: undefined,
          assignee: eleni,
          priority: 2,
          labels: [bug, needsDesign],
        },
      ],
    })
  })

  it('matches by email name when the username differs', () => {
    const result = resolveIssues([draft({ assignee: 'nk' })], directory)

    expect(result.ok && result.issues[0]?.assignee).toBe(nikosK)
  })

  it('asks which person when a first name is shared', () => {
    expect(resolveIssues([draft({ assignee: 'nikos' })], directory)).toEqual({
      ok: false,
      problems: ['@nikos could be @ngeorgiou, @nkostas.'],
    })
  })

  it('prefers a username match over a first-name match', () => {
    const result = resolveIssues([draft({ assignee: 'nikos' })], {
      ...directory,
      members: [
        ...directory.members,
        { ...eleni, id: 'u4', displayName: 'nikos' },
      ],
    })

    expect(result.ok && result.issues[0]?.assignee?.id).toBe('u4')
  })

  it('lists every unknown name and label with suggestions', () => {
    expect(
      resolveIssues(
        [draft(), draft({ assignee: 'maria', labels: ['bugg'] })],
        directory,
      ),
    ).toEqual({
      ok: false,
      problems: [
        'Issue 2: No teammate called @maria. Try: @eleni, @ngeorgiou, @nkostas',
        'Issue 2: No label called #bugg. Labels: Bug, Needs design',
      ],
    })
  })
})
