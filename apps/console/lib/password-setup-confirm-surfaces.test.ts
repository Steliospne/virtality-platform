import { describe, expect, it } from 'vitest'
import { CONFIRM_FORM_PATH, readConsoleFile } from './password-surface-seams.js'

describe('password setup confirm route regression surfaces', () => {
  const source = readConsoleFile(CONFIRM_FORM_PATH)

  it('inspects the token on load without approving immediately', () => {
    expect(source).toMatch(/useInspectPendingPasswordChange/)
    expect(source).toMatch(/inspect\(\{ token \}\)/)
    expect(source).toMatch(/Opening this page did not change your account/)
  })

  it('shows a checking state while inspect is pending', () => {
    expect(source).toMatch(/Checking approval link/)
    expect(source).toMatch(/isInspecting \|\| inspectResult === undefined/)
  })

  it('routes invalid inspect results to the invalid link card', () => {
    expect(source).toMatch(/!inspectResult\.valid/)
  })

  it('shows setup and change approval states for valid pending requests', () => {
    expect(source).toMatch(/inspectResult\.kind === 'CHANGE'/)
    expect(source).toMatch(/Approve password change/)
    expect(source).toMatch(/Approve password setup/)
    expect(source).toMatch(/approve\(\{ token \}\)/)
    expect(source).toMatch(/useApprovePendingPasswordChange/)
  })

  it('shows approved success copy and navigation after explicit approval', () => {
    expect(source).toMatch(/if \(isApproved\)/)
    expect(source).toMatch(/Password changed/)
    expect(source).toMatch(/Password set/)
    expect(source).toMatch(
      /Your new password has been approved and is now active/,
    )
    expect(source).toMatch(/invalidateQueries/)
    expect(source).toMatch(/orpc\.user\.hasPassword\.key\(\)/)
    expect(source).toMatch(/orpc\.pendingPasswordChange\.getActive\.key\(\)/)
    expect(source).toMatch(/router\.push\(returnNavigation\.href\)/)
  })

  it('routes matching signed-in users back to profile after success', () => {
    expect(source).toMatch(/getReturnNavigation\(session, true\)/)
    expect(source).toMatch(/Back to profile/)
    expect(source).toMatch(/\/user\/\$\{session\.user\.id\}\/profile/)
  })
})
