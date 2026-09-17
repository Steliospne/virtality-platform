'use client'
import { useCell, useStore } from 'tinybase/ui-react'
import { authClient } from '@/auth-client'
import { parseDashboardMode } from '@/lib/dashboard-mode'
import type { DashboardMode } from '@/types/models'

/**
 * Per-user memory of the last dashboard mode, kept on the user's row in the
 * TinyBase `users` table so it survives reloads and follows the signed-in user.
 */
export function useRememberedDashboardMode() {
  const { data } = authClient.useSession()
  const userId = data?.user?.id ?? ''
  const store = useStore()
  const rememberedMode = parseDashboardMode(
    useCell('users', userId, 'lastDashboardMode'),
  )

  const rememberMode = (mode: DashboardMode) => {
    if (!userId) return
    store?.setCell('users', userId, 'lastDashboardMode', mode)
  }

  return { rememberedMode, rememberMode }
}
