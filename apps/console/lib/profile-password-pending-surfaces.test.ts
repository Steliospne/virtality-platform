import { describe, expect, it } from 'vitest'
import { readConsoleFile } from './catalog-first-authoring-surface-seams.js'

const PROFILE_INFO_PATH =
  'app/(app)/user/[id]/profile/_components/profile-info.tsx'

function readPasswordCardBody(source: string): string {
  return (
    source.match(
      /const PasswordCardBody = \([\s\S]*?\n\}\n\nconst SignInMethods/,
    )?.[0] ?? ''
  )
}

describe('profile password card regression surfaces', () => {
  const source = readConsoleFile(PROFILE_INFO_PATH)
  const passwordCardBody = readPasswordCardBody(source)

  it('shows a loading skeleton while password state is resolving', () => {
    expect(passwordCardBody).toMatch(/if \(isLoading\)/)
    expect(passwordCardBody).toMatch(/<Skeleton/)
    expect(source).toMatch(
      /isLoadingHasPassword \|\| isLoadingPendingPasswordChange/,
    )
  })

  it('renders the change-password form when the user already has a password', () => {
    expect(passwordCardBody).toMatch(/if \(hasPassword\)/)
    expect(passwordCardBody).toMatch(/<PasswordField \/>/)
    expect(source).toMatch(/currentPassword/)
    expect(source).toMatch(/useStartPasswordChange/)
    expect(source).toMatch(/PasswordFormSchema/)
  })

  it('renders the first-time setup form when the user has no password', () => {
    const setPasswordFormSchema =
      source.match(
        /const SetPasswordFormSchema = z\.object\(\{[\s\S]*?\}\)/,
      )?.[0] ?? ''

    expect(passwordCardBody).toMatch(/<SetPasswordField \/>/)
    expect(source).toMatch(/You have not set a password yet/)
    expect(source).toMatch(/useStartPasswordSetup/)
    expect(setPasswordFormSchema).toMatch(/newPassword/)
    expect(setPasswordFormSchema).not.toMatch(/currentPassword/)
  })

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

  it('uses shared password policy validation in profile forms', () => {
    expect(source).toMatch(/isValidPassword/)
    expect(source).toMatch(/PASSWORD_MIN_LENGTH/)
    expect(source).toMatch(/PASSWORD_MAX_LENGTH/)
  })
})
