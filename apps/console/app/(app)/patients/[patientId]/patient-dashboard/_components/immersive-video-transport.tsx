'use client'

import { PauseCircle, PlayCircle, StopCircle } from 'lucide-react'
import { Button } from '@virtality/ui/components/button'
import { useImmersiveVideoSession } from '@/context/immersive-video-session-context'
import { isImmersivePickerRowSelectable } from '@/lib/immersive-video-picker'
import { HEADSET_VIDEO_SUPPORT } from '@/lib/immersive-video-headset-support'
import {
  isImmersiveStopEnabled,
  resolveImmersivePlayPauseControl,
  shouldShowImmersiveStop,
} from '@/lib/immersive-video-transport'

export function ImmersiveVideoTransport() {
  const { selectedRow, playback, roomComplete, frozen } =
    useImmersiveVideoSession()
  const { state, sendPlay, sendPause, sendStop } = playback
  const readySelected =
    selectedRow != null && isImmersivePickerRowSelectable(selectedRow.cell)
  const commandsEnabled = roomComplete && !frozen
  const playPause = resolveImmersivePlayPauseControl({
    status: state.status,
    commandsEnabled,
    readySelected,
  })
  // Until the headset handles `videoPause`, the primary button only plays.
  const showPlayPause =
    HEADSET_VIDEO_SUPPORT.playbackPause || playPause.action === 'play'
  const showStop = shouldShowImmersiveStop(state.status)
  const stopEnabled = isImmersiveStopEnabled({
    status: state.status,
    commandsEnabled,
  })

  const handlePlayPause = () => {
    if (playPause.action === 'play') {
      if (selectedRow) sendPlay(selectedRow.videoId)
      return
    }
    sendPause()
  }

  return (
    <>
      {showPlayPause ? (
        <Button
          variant='primary'
          size='icon'
          aria-label={playPause.icon === 'play' ? 'Play' : 'Pause'}
          disabled={playPause.disabled}
          onClick={handlePlayPause}
        >
          {playPause.icon === 'play' ? (
            <PlayCircle className='size-6' />
          ) : (
            <PauseCircle className='size-6' />
          )}
        </Button>
      ) : null}
      {showStop ? (
        <Button
          size='icon'
          variant='destructive'
          aria-label='Stop'
          disabled={!stopEnabled}
          onClick={sendStop}
        >
          <StopCircle className='size-6' />
        </Button>
      ) : null}
    </>
  )
}
