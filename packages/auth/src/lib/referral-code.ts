import { prisma } from '@virtality/db'
import type { Prisma } from '@virtality/db'
/**
 * Validates and consumes a one-time referral code.
 * Returns true if the code was valid and successfully consumed, false otherwise.
 *
 * Requires Prisma model ReferralCode with columns: id, code, usedAt, usedBy
 */
export default async function validateAndConsumeReferralCode(
  code: string,
  userId: string,
): Promise<boolean> {
  const trimmed = code?.trim()
  if (!trimmed) return false

  const where: Prisma.ReferralCodeWhereInput = {
    code: trimmed,
    usedAt: null,
  }
  const data: Prisma.ReferralCodeUncheckedUpdateManyInput = {
    usedAt: new Date(),
    usedBy: userId,
  }

  const { count } = await prisma.referralCode.updateMany({ where, data })
  return count > 0
}
