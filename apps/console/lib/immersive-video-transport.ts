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
}): ImmersivePlayPauseControl {
  const { status, commandsEnabled, readySelected } = input

  if (status === 'Playing') {
    return { icon: 'pause', disabled: !commandsEnabled, action: 'pause' }
  }
  if (status === 'Paused') {
    return { icon: 'play', disabled: !commandsEnabled, action: 'pause' }
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

export function isImmersiveStopEnabled(input: {
  status: ImmersivePlaybackStatus
  commandsEnabled: boolean
}): boolean {
  return input.commandsEnabled && isPlayingOrPaused(input.status)
}

export function isImmersiveRecenterEnabled(input: {
  status: ImmersivePlaybackStatus
  commandsEnabled: boolean
}): boolean {
  return input.commandsEnabled && isPlayingOrPaused(input.status)
}
