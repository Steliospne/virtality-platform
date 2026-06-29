import { describe, expect, it } from 'vitest'
import { readConsoleFile } from './catalog-first-authoring-surface-seams.js'

const PROFILE_INFO_PATH =
  'app/(app)/user/[id]/profile/_components/profile-info.tsx'

describe('profile password pending state surfaces', () => {
  const source = readConsoleFile(PROFILE_INFO_PATH)

  it('shows pending state before password setup or change forms', () => {
    const pendingBranch =
      source.match(
        /if \(activePendingPasswordChange\)[\s\S]*?if \(hasPassword\)/,
      )?.[0] ?? ''

    expect(pendingBranch).toMatch(/<PendingPasswordState/)
    expect(pendingBranch).toMatch(/activePendingPasswordChange/)
  })

  it('displays destination email and expiry in the pending state', () => {
    expect(source).toMatch(/destinationEmail/)
    expect(source).toMatch(/expiresAt/)
    expect(source).toMatch(/expires at/)
  })

  it('wires resend and cancel actions for pending password requests', () => {
    expect(source).toMatch(/useResendPendingPasswordChange/)
    expect(source).toMatch(/useCancelPendingPasswordChange/)
    expect(source).toMatch(/Resend email/)
    expect(source).toMatch(/Cancel request/)
    expect(source).toMatch(/invalidateActivePendingPasswordChange/)
  })

  it('uses setup and change copy based on pending request kind', () => {
    expect(source).toMatch(/PENDING_PASSWORD_KIND_LABEL/)
    expect(source).toMatch(/Password setup/)
    expect(source).toMatch(/Password change/)
  })
})
