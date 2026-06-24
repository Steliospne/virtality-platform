import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const consoleRoot = fileURLToPath(new URL('..', import.meta.url))

function readConsoleFile(relativePath: string): string {
  return readFileSync(join(consoleRoot, relativePath), 'utf8')
}

describe('patient dashboard casting panel surfaces', () => {
  it('keeps the toolbar Cast button as a show-hide toggle only', () => {
    const controlPanelSource = readConsoleFile(
      'app/(app)/patients/[patientId]/patient-dashboard/_components/control-panel.tsx',
    )

    expect(controlPanelSource).toMatch(/setShowCasting\(\(prev\) => !prev\)/)
    expect(controlPanelSource).not.toMatch(/startCasting/)
    expect(controlPanelSource).not.toMatch(/stopCasting/)
  })

  it('renders a single casting control and player states in the panel', () => {
    const castingPanelSource = readConsoleFile(
      'components/ui/casting-panel.tsx',
    )

    expect(castingPanelSource).toMatch(/getCastingControlLabelForAction/)
    expect(castingPanelSource).toMatch(/CastingPlayerOverlay/)
    expect(castingPanelSource).toMatch(/CastingLoadingState/)
    expect(castingPanelSource).toMatch(/CastingTimeoutPrompt/)
    expect(castingPanelSource).toMatch(/Wait/)
    expect(castingPanelSource).toMatch(/Cancel/)
    expect(castingPanelSource).toMatch(/controls=\{showVideoControls\}/)
    expect(castingPanelSource).not.toMatch(/Stop casting[\s\S]*Start casting/)
  })
})
