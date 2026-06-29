import { describe, expect, it } from 'vitest'
import { CONFIRM_FORM_PATH, readConsoleFile } from './password-surface-seams.js'

describe('password setup confirm invalid link surfaces', () => {
  const source = readConsoleFile(CONFIRM_FORM_PATH)

  it('uses generic invalid approval copy without state-specific messaging', () => {
    expect(source).toMatch(/INVALID_APPROVAL_LINK_MESSAGE/)
    expect(source).not.toMatch(
      /expired|cancelled|canceled|superseded|consumed/i,
    )
  })

  it('routes matching signed-in users back to profile on invalid links', () => {
    expect(source).toMatch(/canReturnToProfile/)
    expect(source).toMatch(/Back to profile/)
    expect(source).toMatch(/getReturnNavigation\(session, canReturnToProfile\)/)
  })

  it('offers sign-in only when profile return is unavailable', () => {
    expect(source).toMatch(/Sign in/)
    expect(source).toMatch(/canReturnToProfile=\{false\}/)
  })
})
