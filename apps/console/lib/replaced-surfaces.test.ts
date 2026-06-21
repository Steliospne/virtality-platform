import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import sidebarLinks from '../data/static/sidebar-links.js'

const consoleRoot = fileURLToPath(new URL('..', import.meta.url))

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

describe('replaced clinician surfaces', () => {
  it('removes the old presets route from the console app', () => {
    expect(pathExists('app/(app)/presets/page.tsx')).toBe(false)
    expect(pathExists('app/(app)/presets/new/page.tsx')).toBe(false)
  })

  it('removes patient-specific program management routes', () => {
    expect(pathExists('app/(app)/patients/[patientId]/programs/page.tsx')).toBe(
      false,
    )
    expect(
      pathExists(
        'app/(app)/patients/[patientId]/programs/new/_components/program-form.tsx',
      ),
    ).toBe(false)
  })

  it('routes clinicians to the Program Library from the sidebar', () => {
    const programLink = sidebarLinks.find((link) => link.title === 'programs')

    expect(programLink?.url).toBe('/programs')
    expect(sidebarLinks.some((link) => link.url.includes('preset'))).toBe(false)
  })

  it('keeps Program Library creation routes for scratch and template flows', () => {
    expect(pathExists('app/(app)/programs/page.tsx')).toBe(true)
    expect(pathExists('app/(app)/programs/new/page.tsx')).toBe(true)
    expect(
      pathExists(
        'app/(app)/programs/new/_components/reusable-program-create-flow.tsx',
      ),
    ).toBe(true)
  })

  it('does not expose a patient Programs tab in the patient layout', () => {
    const layoutSource = readConsoleFile(
      'app/(app)/patients/[patientId]/layout.tsx',
    )

    expect(layoutSource).not.toMatch(/Programs/)
    expect(layoutSource).not.toMatch(/\/programs/)
  })

  it('uses reusable program selection on the patient dashboard', () => {
    const selectorSource = readConsoleFile(
      'app/(app)/patients/[patientId]/patient-dashboard/_components/program-selector.tsx',
    )

    expect(selectorSource).toMatch(/useReusablePrograms/)
    expect(selectorSource).not.toMatch(/usePatientPrograms/)
  })

  it('removes orphaned preset i18n locale files', () => {
    expect(pathExists('i18n/locales/en/preset.json')).toBe(false)
    expect(pathExists('i18n/locales/el/preset.json')).toBe(false)
  })

  it('uses starter-template vocabulary in clinician analytics events', () => {
    const analyticsSource = readConsoleFile('lib/analytics-contract.ts')

    expect(analyticsSource).toMatch(/starter_template/)
    expect(analyticsSource).not.toMatch(/preset_created/)
    expect(analyticsSource).not.toMatch(/preset_updated/)
    expect(analyticsSource).not.toMatch(/preset_applied_to_program/)
    expect(analyticsSource).not.toMatch(/source_preset_id/)
    expect(analyticsSource).not.toMatch(/'preset'/)
  })
})
