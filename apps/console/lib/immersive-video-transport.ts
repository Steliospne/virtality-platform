import {
  isPlayingOrPaused,
  type ImmersivePlaybackStatus,
} from './immersive-video-playback-reducer'

export type ImmersivePlayPauseAction = 'play' | 'pause'

export type ImmersivePlayPauseControl = {
  icon: 'play' | 'pause'
  disabled: boolean
  action: ImmersivePlayPauseAction
}

export function resolveImmersivePlayPauseControl(input: {
  status: ImmersivePlaybackStatus
  commandsEnabled: boolean
  readySelected: boolean
  /** `videoStop` sent and not yet acknowledged. */
  stopping?: boolean
}): ImmersivePlayPauseControl {
  const { status, commandsEnabled, readySelected, stopping = false } = input
  const heldDisabled = !commandsEnabled || stopping

  if (status === 'Playing') {
    return { icon: 'pause', disabled: heldDisabled, action: 'pause' }
  }
  if (status === 'Paused') {
    return { icon: 'play', disabled: heldDisabled, action: 'pause' }
  }
  if (status === 'Starting') {
    return { icon: 'play', disabled: true, action: 'play' }
  }

  return {
    icon: 'play',
    disabled: !commandsEnabled || !readySelected,
    action: 'play',
  }
}

export function shouldShowImmersiveStop(
  status: ImmersivePlaybackStatus,
): boolean {
  return isPlayingOrPaused(status)
}

/** Stop is held off while an earlier `videoStop` awaits its ack. */
export function isImmersiveStopEnabled(input: {
  status: ImmersivePlaybackStatus
  commandsEnabled: boolean
  stopping?: boolean
}): boolean {
  return (
    input.commandsEnabled && !input.stopping && isPlayingOrPaused(input.status)
  )
}

/** Recentre reuses the program's `resetPosition`; its ack is toasted by the dashboard. */
export function isImmersiveRecenterEnabled(input: {
  status: ImmersivePlaybackStatus
  commandsEnabled: boolean
}): boolean {
  return input.commandsEnabled && isPlayingOrPaused(input.status)
}
