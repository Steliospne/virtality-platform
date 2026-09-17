import { describe, expect, it } from 'vitest'
import {
  PATIENT_DASHBOARD_PATH,
  readConsoleFile,
} from './catalog-first-authoring-surface-seams.js'

const COMPONENTS_DIR =
  'app/(app)/patients/[patientId]/patient-dashboard/_components'
const IMMERSIVE_PANEL_PATH = `${COMPONENTS_DIR}/immersive-video-panel.tsx`
const SELECTED_CARD_PATH = `${COMPONENTS_DIR}/immersive-video-selected-card.tsx`

describe('patient dashboard immersive surfaces', () => {
  it('hides the exercise list column when Immersive Video mode is selected', () => {
    const dashboard = readConsoleFile(PATIENT_DASHBOARD_PATH)
    const panel = readConsoleFile(IMMERSIVE_PANEL_PATH)

    expect(dashboard).toMatch(/hideExerciseList: isImmersive/)
    expect(dashboard).toMatch(/\{isImmersive \? null : \(/)
    expect(dashboard).toMatch(
      /<ExerciseList className=\{exerciseListClassName\} \/>/,
    )
    expect(dashboard).not.toMatch(/cardClassName=\{exerciseListClassName\}/)
    expect(panel).toMatch(/ImmersiveVideoSelectedCard/)
  })

  it('stacks casting under the video card instead of replacing it', () => {
    const dashboard = readConsoleFile(PATIENT_DASHBOARD_PATH)

    expect(dashboard).toMatch(/dashboardImmersiveStackClassName\(gridFlags\)/)
    expect(dashboard).toMatch(
      /\{showCasting \? <CastingContent className='min-h-0 flex-1' \/> : null\}/,
    )
    expect(dashboard).not.toMatch(/isImmersive && !showCasting/)
  })

  it('keeps the playback bar and session timer inside the video card', () => {
    const card = readConsoleFile(SELECTED_CARD_PATH)

    expect(card).toMatch(/shouldShowImmersivePlaybackBar/)
    expect(card).toMatch(/<ImmersiveVideoPlaybackBar \/>/)
    expect(card).toMatch(/<ImmersiveVideoSessionTimer \/>/)
    expect(card).not.toMatch(/immersiveHintLine/)
  })

  it('uses one play/pause control like program mode, not separate resume', () => {
    const transport = readConsoleFile(
      `${COMPONENTS_DIR}/immersive-video-transport.tsx`,
    )

    expect(transport).toMatch(/resolveImmersivePlayPauseControl/)
    expect(transport).toMatch(/shouldShowImmersiveStop/)
    expect(transport).not.toMatch(/aria-label='Resume'/)
  })
})
