import { prisma } from '@virtality/db'
import type { Prisma } from '@virtality/db'

/** `TE-` plus ten alphanumeric characters (locked in #31 / #36). */
export const TESTER_CODE_PATTERN = /^TE-[A-Z0-9]{10}$/i

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
