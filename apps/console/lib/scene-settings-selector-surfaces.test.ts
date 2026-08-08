import { describe, expect, it } from 'vitest'
import { readConsoleFile } from './catalog-first-authoring-surface-seams.js'

const AVATAR_SELECTOR_PATH =
  'app/(app)/patients/[patientId]/patient-dashboard/_components/avatar-selector.tsx'
const MAP_SELECTOR_PATH =
  'app/(app)/patients/[patientId]/patient-dashboard/_components/map-selector.tsx'

/**
 * Scene Settings mounts these selectors. If they call setState while resolving
 * Select `value` during render (especially when catalogs are still loading and
 * selected* is null), React hits maximum update depth and freezes the page.
 */
describe('scene settings selector surfaces', () => {
  it('does not call setSelectedAvatar while resolving Select value during render', () => {
    const source = readConsoleFile(AVATAR_SELECTOR_PATH)

    expect(source).not.toMatch(
      /value=\{selectedAvatar\?\.id \?\? defaultValue\(\)\}/,
    )
    expect(source).not.toMatch(
      /const defaultValue = \(\) => \{[\s\S]*setSelectedAvatar/,
    )
  })

  it('does not call setSelectedMap while resolving Select value during render', () => {
    const source = readConsoleFile(MAP_SELECTOR_PATH)

    expect(source).not.toMatch(
      /value=\{selectedMap\?\.id \?\? defaultValue\(\)\}/,
    )
    expect(source).not.toMatch(
      /const defaultValue = \(\) => \{[\s\S]*setSelectedMap/,
    )
  })
})
