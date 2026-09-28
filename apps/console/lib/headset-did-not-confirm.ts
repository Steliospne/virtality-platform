export type HeadsetDidNotConfirmReason = 'didnt-respond' | 'disconnected'

export type HeadsetDidNotConfirmIntent = 'download' | 'play' | 'stop'

const DIDNT_RESPOND =
  "Headset didn't respond. Check it's on and the app is open."

const COPY: Record<
  HeadsetDidNotConfirmIntent,
  Record<HeadsetDidNotConfirmReason, string>
> = {
  download: {
    'didnt-respond': DIDNT_RESPOND,
    disconnected:
      "The headset disconnected before confirming the download. When it reconnects, check the list. If the video isn't downloading, click Download again.",
  },
  play: {
    'didnt-respond': DIDNT_RESPOND,
    disconnected:
      "The headset disconnected before confirming playback. When it reconnects, check the list. If the video isn't playing, press Play again.",
  },
  stop: {
    'didnt-respond':
      "Headset didn't confirm the stop. Check it's on and the app is open, then press Stop again.",
    disconnected:
      'The headset disconnected before confirming the stop. When it reconnects, check whether the video is still playing on the headset.',
  },
}

export function headsetDidNotConfirmCopy(
  intent: HeadsetDidNotConfirmIntent,
  reason: HeadsetDidNotConfirmReason,
): string {
  return COPY[intent][reason]
}
