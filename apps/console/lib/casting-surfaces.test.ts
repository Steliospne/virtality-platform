import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import sidebarLinks from '../data/static/sidebar-links.js'

const consoleRoot = fileURLToPath(new URL('..', import.meta.url))

const STANDALONE_CASTING_ROUTE = 'app/(app)/casting/page.tsx'
const PATIENT_DASHBOARD_PATH =
  'app/(app)/patients/[patientId]/patient-dashboard/_components/patient-dashboard.tsx'
const CONTROL_PANEL_PATH =
  'app/(app)/patients/[patientId]/patient-dashboard/_components/control-panel.tsx'

function readConsoleFile(relativePath: string): string {
  return readFileSync(join(consoleRoot, relativePath), 'utf8')
}

function pathExists(relativePath: string): boolean {
  try {
    readFileSync(join(consoleRoot, relativePath))
    return true
  } catch {
    return false
  }
}

describe('casting surfaces', () => {
  it('removes the standalone casting test route from the console app', () => {
    expect(pathExists(STANDALONE_CASTING_ROUTE)).toBe(false)
  })

  it('does not link to the standalone casting route from the sidebar', () => {
    expect(sidebarLinks.some((link) => link.url === '/casting')).toBe(false)
  })

  it('keeps the patient dashboard casting panel toggle', () => {
    const dashboardSource = readConsoleFile(PATIENT_DASHBOARD_PATH)
    const controlPanelSource = readConsoleFile(CONTROL_PANEL_PATH)

    expect(dashboardSource).toMatch(
      /const \[showCasting, setShowCasting\] = useState\(false\)/,
    )
    expect(dashboardSource).toMatch(/showCasting \? /)
    expect(dashboardSource).toMatch(/<CastingContent/)
    expect(dashboardSource).toMatch(/useCastingHandshake\(/)

    expect(controlPanelSource).toMatch(/<CastingButton/)
    expect(controlPanelSource).toMatch(/setShowCasting=\{setShowCasting\}/)
  })
})
