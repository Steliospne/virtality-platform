import type { ParsePayload } from 'zod/v4/core'

export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 16
export const INVALID_APPROVAL_LINK_MESSAGE =
  'This approval link is invalid or has expired.'

export const isValidPassword = (ctx: ParsePayload<string>) => {
  if (
    ctx.value.length < PASSWORD_MIN_LENGTH ||
    ctx.value.length > PASSWORD_MAX_LENGTH
  ) {
    ctx.issues.push({
      message: '• Password must be between 8 and 16 characters long.',
      input: ctx.value,
      code: 'length' as 'custom',
    })
  }

  if (!/(?=.*[A-Z]).+/.test(ctx.value)) {
    ctx.issues.push({
      message: '• Password must contain at least one uppercase letter.',
      input: ctx.value,
      code: 'uppercase' as 'custom',
    })
  }

  if (!/(?=.*[a-z]).+/.test(ctx.value)) {
    ctx.issues.push({
      message: '• Password must contain at least one lowercase letter.',
      input: ctx.value,
      code: 'lowercase' as 'custom',
    })
  }

  if (!/(?=.*\d).+/.test(ctx.value)) {
    ctx.issues.push({
      message: '• Password must contain at least one digit.',
      input: ctx.value,
      code: 'digit' as 'custom',
    })
  }
}

export const collectPasswordIssues = (password: string) => {
  const issues: { message: string }[] = []
  isValidPassword({
    value: password,
    issues,
  } as Parameters<typeof isValidPassword>[0])
  return issues
}
