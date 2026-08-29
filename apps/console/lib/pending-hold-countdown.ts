/**
 * Format remaining Checkout-hold TTL as m:ss for the Cancel-adjacent timer.
 */
export function formatPendingHoldCountdown(remainingMs: number): string {
  const totalSec = Math.max(0, Math.ceil(remainingMs / 1000))
  const minutes = Math.floor(totalSec / 60)
  const seconds = totalSec % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/** Milliseconds left until `expiresAt`, floored at 0. */
export function pendingHoldRemainingMs(
  expiresAt: Date | string,
  nowMs: number = Date.now(),
): number {
  const end =
    typeof expiresAt === 'string' ? Date.parse(expiresAt) : expiresAt.getTime()
  if (Number.isNaN(end)) return 0
  return Math.max(0, end - nowMs)
}
