import { ACCESS_CODE_PARAM } from './access-code-url.ts'

export type TrialRedeemEmailCtaVariant = 'no_account' | 'existing_account'

export type TrialRedeemEmailCta = {
  ctaVariant: TrialRedeemEmailCtaVariant
  ctaUrl: string
}

function normalizeConsoleBaseUrl(consoleBaseUrl: string): string {
  return consoleBaseUrl.replace(/\/$/, '')
}

/** Sign-up deep link with Access Code prefill for recipients without an account. */
export function buildTrialRedeemSignUpUrl(
  consoleBaseUrl: string,
  code: string,
): string {
  const base = normalizeConsoleBaseUrl(consoleBaseUrl)
  const params = new URLSearchParams({ [ACCESS_CODE_PARAM]: code })
  return `${base}/sign-up?${params.toString()}`
}

/** Profile Billing deep link with Access Code prefill for existing accounts. */
export function buildTrialRedeemBillingUrl(
  consoleBaseUrl: string,
  userId: string,
  code: string,
): string {
  const base = normalizeConsoleBaseUrl(consoleBaseUrl)
  const params = new URLSearchParams({
    tab: 'billing',
    [ACCESS_CODE_PARAM]: code,
  })
  return `${base}/user/${userId}/profile?${params.toString()}`
}

export function resolveTrialRedeemEmailCta(
  consoleBaseUrl: string,
  code: string,
  foundUserId: string | null,
): TrialRedeemEmailCta {
  if (foundUserId) {
    return {
      ctaVariant: 'existing_account',
      ctaUrl: buildTrialRedeemBillingUrl(consoleBaseUrl, foundUserId, code),
    }
  }

  return {
    ctaVariant: 'no_account',
    ctaUrl: buildTrialRedeemSignUpUrl(consoleBaseUrl, code),
  }
}
