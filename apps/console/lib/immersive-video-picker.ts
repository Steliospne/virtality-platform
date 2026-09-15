import type { HeadsetLibraryCell } from '@/lib/headset-library-rows'
import {
  formatActivityLabel,
  formatDurationLabel,
} from '@/lib/headset-library-format'

/**
 * A video the mirror says the headset holds can be picked before the headset
 * is in the room; the transport still waits for it.
 */
export function isImmersivePickerRowSelectable(
  cell: HeadsetLibraryCell,
): boolean {
  return cell.type === 'on-headset' || cell.type === 'offline-on-headset'
}

export function immersivePickerMetaLine(input: {
  activity: 'CYCLING' | 'WALKING' | null
  durationSec: number | null
}): string {
  return [
    formatActivityLabel(input.activity),
    formatDurationLabel(input.durationSec),
  ]
    .filter((part): part is string => part != null && part.length > 0)
    .join(' · ')
}

export function immersiveSelectedMetaLine(input: {
  activity: 'CYCLING' | 'WALKING' | null
}): string {
  const activity = formatActivityLabel(input.activity) ?? 'Activity'
  return `${activity} · 180° FPV`
}

export function immersiveHeadsetGateCopy(input: {
  roomComplete: boolean
  replaced: boolean
  pollOnline: boolean
}): string | null {
  if (input.replaced || input.roomComplete) return null
  if (input.pollOnline) return 'Connecting to headset…'
  return 'Turn the headset on and open the app.'
}
