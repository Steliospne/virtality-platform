/**
 * Shared path and source-reading seams for password surface regression tests.
 */

import { readConsoleFile } from './catalog-first-authoring-surface-seams.js'

export const CONFIRM_FORM_PATH =
  'app/(auth)/password-setup/confirm/confirm-form.tsx'

export const PROFILE_INFO_PATH =
  'app/(app)/user/[id]/profile/_components/profile-info.tsx'

export function readPasswordCardBody(source: string): string {
  return (
    source.match(
      /const PasswordCardBody = \([\s\S]*?\n\}\n\nconst SignInMethods/,
    )?.[0] ?? ''
  )
}

export function readZodObjectSchema(
  source: string,
  schemaName: string,
): string {
  return (
    source.match(
      new RegExp(`const ${schemaName} = z\\.object\\(\\{[\\s\\S]*?\\}\\)`),
    )?.[0] ?? ''
  )
}

export { readConsoleFile }
