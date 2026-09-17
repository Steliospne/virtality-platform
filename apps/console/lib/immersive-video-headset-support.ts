/**
 * Which Immersive Video controls the headset app implements today. The
 * events exist in the wire contract; a control whose command the headset
 * does not handle yet is hidden, not removed, so turning it on is a one-line
 * change once the VR build lands. Cancel is acknowledged but not honoured
 * on the headset, so it stays visible only for withdrawing a `requested`
 * row (see `useHeadsetLibrary`).
 */
export const HEADSET_VIDEO_SUPPORT = {
  /** `videoDownloadPause` / `videoDownloadPaused` */
  downloadPause: false,
  /** `videoPause` (toggle) */
  playbackPause: false,
} as const
