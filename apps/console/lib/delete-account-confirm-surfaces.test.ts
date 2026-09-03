import { describe, expect, it } from 'vitest'
import { readConsoleFile } from './password-surface-seams.js'

const CONFIRM_FORM_PATH = 'app/(auth)/delete-account/confirm/confirm-form.tsx'

describe('delete account confirm route regression surfaces', () => {
  const source = readConsoleFile(CONFIRM_FORM_PATH)

  it('inspects the token on load without approving immediately', () => {
    expect(source).toMatch(/useInspectPendingAccountDeletion/)
    expect(source).toMatch(/inspect\(\{ token \}\)/)
    expect(source).toMatch(
      /Opening\s+this\s+page\s+did\s+not\s+delete\s+your\s+account/,
    )
  })

  it('shows a checking state while inspect is pending', () => {
    expect(source).toMatch(/Checking approval link/)
    expect(source).toMatch(/isInspecting \|\| inspectResult === undefined/)
  })

  it('routes invalid inspect results to the invalid link card', () => {
    expect(source).toMatch(/!inspectResult\.valid/)
  })

  it('requires an explicit approve action to delete the account', () => {
    expect(source).toMatch(/Approve account deletion/)
    expect(source).toMatch(/approve\(\{ token \}\)/)
    expect(source).toMatch(/useApprovePendingAccountDeletion/)
  })

  it('signs out and redirects to goodbye after explicit approval', () => {
    expect(source).toMatch(/authClient\.signOut\(\)/)
    expect(source).toMatch(/router\.push\('\/goodbye'\)/)
  })

  it('routes matching signed-in users back to profile on invalid links', () => {
    expect(source).toMatch(/getReturnNavigation\(session, true\)/)
    expect(source).toMatch(/Back to profile/)
    expect(source).toMatch(/\/user\/\$\{session\.user\.id\}\/profile/)
  })
})
