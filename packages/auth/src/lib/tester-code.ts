import { prisma } from '@virtality/db'
import type { Prisma } from '@virtality/db'
import { TESTER_CODE_PATTERN } from '@virtality/shared/utils'

export { TESTER_CODE_PATTERN }

/**
 * Validates and consumes a one-time Tester Code.
 * Returns true if the code was valid and successfully consumed, false otherwise.
 *
 * Requires Prisma model TesterCode with columns: id, code, usedAt, usedBy
 */
export default async function validateAndConsumeTesterCode(
  code: string,
  userId: string,
): Promise<boolean> {
  const trimmed = code?.trim()
  if (!trimmed) return false
  if (!TESTER_CODE_PATTERN.test(trimmed)) return false

  const normalized = trimmed.toUpperCase()

  const where: Prisma.TesterCodeWhereInput = {
    code: normalized,
    usedAt: null,
  }
  const data: Prisma.TesterCodeUncheckedUpdateManyInput = {
    usedAt: new Date(),
    usedBy: userId,
  }

  const { count } = await prisma.testerCode.updateMany({ where, data })
  return count > 0
}
