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

const todo = { id: 's1', name: 'Todo' }
const inProgress = { id: 's2', name: 'In Progress' }
const inReview = { id: 's3', name: 'In Review' }

const directory = {
  members: [eleni, nikos, nikosK],
  labels: [bug, needsDesign],
  statuses: [todo, inProgress, inReview],
}

function draft(overrides?: Partial<IssueDraft>): IssueDraft {
  return {
    title: 'Fix login',
    description: undefined,
    assignee: undefined,
    priority: undefined,
    labels: [],
    status: undefined,
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
          status: undefined,
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

  it('finds a person by the start of their username', () => {
    const steliospnev = {
      id: 'u5',
      name: 's.pnevmatikakis@virtality.app',
      displayName: 'steliospnev',
      email: 's.pnevmatikakis@virtality.app',
    }
    const result = resolveIssues([draft({ assignee: 'stelios' })], {
      ...directory,
      members: [...directory.members, steliospnev],
    })

    expect(result.ok && result.issues[0]?.assignee).toBe(steliospnev)
  })

  it.each([
    ['todo', todo],
    ['in-progress', inProgress],
    ['InProgress', inProgress],
    ['in-rev', inReview],
  ])('reads /%s as a status', (typed, status) => {
    const result = resolveIssues([draft({ status: typed })], directory)

    expect(result.ok && result.issues[0]?.status).toBe(status)
  })

  it('asks which status when the start is ambiguous', () => {
    expect(resolveIssues([draft({ status: 'in' })], directory)).toEqual({
      ok: false,
      problems: ['/in could be /in-progress, /in-review.'],
    })
  })

  it('lists every unknown name and label with suggestions', () => {
    expect(
      resolveIssues(
        [
          draft(),
          draft({ assignee: 'maria', labels: ['bugg'], status: 'doing' }),
        ],
        directory,
      ),
    ).toEqual({
      ok: false,
      problems: [
        'Issue 2: No teammate called @maria. Try: @eleni, @ngeorgiou, @nkostas',
        'Issue 2: No label called #bugg. Labels: Bug, Needs design',
        'Issue 2: No status called /doing. Statuses: /todo, /in-progress, /in-review',
      ],
    })
  })
})
