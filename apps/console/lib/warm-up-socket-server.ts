'use client'

import { getSocketUrl } from '@virtality/shared/types'

const socketBaseUrl = getSocketUrl()

/** HTTP path on the socket service that wakes a cold instance before WebSocket use. */
export const SOCKET_WARMUP_PATH = '/warmup'

/**
 * Pings the socket service so it is awake before the user opens devices or a session.
 * Failures are ignored (fire-and-forget).
 */
export async function warmUpSocketServer(): Promise<void> {
  try {
    await fetch(`${socketBaseUrl}${SOCKET_WARMUP_PATH}`, {
      method: 'GET',
      mode: 'cors',
    })
  } catch {
    // Non-blocking: connection may still succeed if the server was already warm.
  }
}
