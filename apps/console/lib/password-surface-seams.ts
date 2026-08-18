/**
 * Shared path and source-reading seams for password surface regression tests.
 */

import { readConsoleFile } from './catalog-first-authoring-surface-seams.js'

export const CONFIRM_FORM_PATH =
  'app/(auth)/password-setup/confirm/confirm-form.tsx'

export const PROFILE_INFO_PATH =
  'app/(app)/user/[id]/profile/_components/profile-info.tsx'

export const PROFILE_PASSWORD_CARD_BODY_PATH =
  'app/(app)/user/[id]/profile/_components/profile-password-card-body.tsx'

export const PROFILE_INFO_FORM_PATH =
  'app/(app)/user/[id]/profile/_components/profile-info-form.ts'

export const PROFILE_PENDING_PASSWORD_PATH =
  'app/(app)/user/[id]/profile/_components/profile-pending-password-state.tsx'

export const PROFILE_PASSWORD_FIELD_PATH =
  'app/(app)/user/[id]/profile/_components/profile-password-field.tsx'

export const PROFILE_SET_PASSWORD_FIELD_PATH =
  'app/(app)/user/[id]/profile/_components/profile-set-password-field.tsx'

export function readProfilePasswordSurface(): string {
  return [
    readConsoleFile(PROFILE_INFO_PATH),
    readConsoleFile(PROFILE_PASSWORD_CARD_BODY_PATH),
    readConsoleFile(PROFILE_INFO_FORM_PATH),
    readConsoleFile(PROFILE_PENDING_PASSWORD_PATH),
    readConsoleFile(PROFILE_PASSWORD_FIELD_PATH),
    readConsoleFile(PROFILE_SET_PASSWORD_FIELD_PATH),
  ].join('\n')
}

export function readPasswordCardBody(source: string): string {
  return (
    source.match(/export const PasswordCardBody = \([\s\S]*?\n\}\n/)?.[0] ??
    source.match(
      /const PasswordCardBody = \([\s\S]*?\n\}\n\nconst SignInMethods/,
    )?.[0] ??
    ''
  )
}

export function readZodObjectSchema(
  source: string,
  schemaName: string,
): string {
  return (
    source.match(
      new RegExp(
        `export const ${schemaName} = z\\.object\\(\\{[\\s\\S]*?\\}\\)`,
      ),
    )?.[0] ??
    source.match(
      new RegExp(`const ${schemaName} = z\\.object\\(\\{[\\s\\S]*?\\}\\)`),
    )?.[0] ??
    ''
  )
}

export { readConsoleFile }
