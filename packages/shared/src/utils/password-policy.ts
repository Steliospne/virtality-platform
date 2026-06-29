import type { ParsePayload } from 'zod/v4/core'

export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 16

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
