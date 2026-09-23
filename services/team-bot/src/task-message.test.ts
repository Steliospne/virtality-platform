import { describe, expect, it } from 'vitest'
import { parseTaskMessage } from './task-message.ts'

describe('parseTaskMessage', () => {
  it('uses the first line as title and the rest as description', () => {
    expect(parseTaskMessage('Fix login\n\nSpins forever\non Safari')).toEqual({
      kind: 'task',
      title: 'Fix login',
      description: 'Spins forever\non Safari',
    })
  })

  it('leaves description empty for a one-line message', () => {
    expect(parseTaskMessage('  Fix login  ')).toEqual({
      kind: 'task',
      title: 'Fix login',
      description: undefined,
    })
  })

  it.each(['help', 'HELP', '?', '   '])(
    'treats %j as a help request',
    (text) => {
      expect(parseTaskMessage(text)).toEqual({ kind: 'help' })
    },
  )

  it('shortens an over-long title and keeps the full text', () => {
    const longLine = 'a'.repeat(250)
    const result = parseTaskMessage(`${longLine}\nmore`)

    expect(result.kind).toBe('task')
    if (result.kind !== 'task') return
    expect(result.title).toHaveLength(200)
    expect(result.title.endsWith('…')).toBe(true)
    expect(result.description).toBe(`${longLine}\n\nmore`)
  })
})
