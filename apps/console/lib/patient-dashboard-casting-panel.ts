import type { CastingStatus } from '@/hooks/use-casting-handshake'

export type CastingPlayerView = 'idle' | 'loading' | 'connected' | 'error'

export type CastingControlAction = 'start' | 'stop'

export const CASTING_LOAD_TIMEOUT_MS = 30_000

export const CASTING_CONTROL_LABELS: Record<CastingControlAction, string> = {
  start: 'Start casting',
  stop: 'Stop casting',
}

export function getCastingPlayerView(status: CastingStatus): CastingPlayerView {
  switch (status) {
    case 'idle':
      return 'idle'
    case 'requesting':
    case 'negotiating':
      return 'loading'
    case 'connected':
      return 'connected'
    case 'error':
      return 'error'
  }
}

export function getCastingControlAction(
  status: CastingStatus,
): CastingControlAction {
  switch (status) {
    case 'idle':
    case 'error':
      return 'start'
    case 'requesting':
    case 'negotiating':
    case 'connected':
      return 'stop'
  }
}

export function getCastingControlLabelForAction(
  action: CastingControlAction,
): string {
  return CASTING_CONTROL_LABELS[action]
}

export function getCastingControlLabel(status: CastingStatus): string {
  return getCastingControlLabelForAction(getCastingControlAction(status))
}

export function isCastingControlDisabled(
  status: CastingStatus,
  connected: boolean,
): boolean {
  return getCastingControlAction(status) === 'start' && !connected
}

export function getCastingStatusLabel(status: CastingStatus): string {
  switch (status) {
    case 'idle':
      return 'Idle'
    case 'requesting':
      return 'Requesting stream...'
    case 'negotiating':
      return 'Connecting...'
    case 'connected':
      return 'Live'
    case 'error':
      return 'Connection failed'
  }
}

export function shouldShowVideoElement(view: CastingPlayerView): boolean {
  return view === 'loading' || view === 'connected'
}

export function shouldShowVideoControls(_view: CastingPlayerView): boolean {
  return false
}

export function isCastingLoadWindow(view: CastingPlayerView): boolean {
  return view === 'loading'
}

export function shouldShowCastingTimeoutPrompt(
  view: CastingPlayerView,
  hasLoadTimedOut: boolean,
): boolean {
  return isCastingLoadWindow(view) && hasLoadTimedOut
}
