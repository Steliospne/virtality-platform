// @vitest-environment node

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const adminboardRoot = fileURLToPath(new URL('..', import.meta.url))

function readAdminboardFile(relativePath: string): string {
  return readFileSync(join(adminboardRoot, relativePath), 'utf8')
}

function expectSharedTablePrimitives(source: string) {
  expect(source).toMatch(/@virtality\/ui\/components\/table/)
  expect(source).not.toMatch(/@\/components\/ui\/table/)
}

function expectSharedDataTableKit(source: string) {
  expect(source).toMatch(/@virtality\/ui\/components\/data-table/)
  expect(source).not.toMatch(/@\/components\/tables\/data-table/)
  expect(source).not.toMatch(/@\/components\/tables\/tanstack-table/)
}

function expectSharedTableConfiguration(source: string) {
  expect(
    source.includes('@virtality/ui/lib/table-defaults') ||
      source.includes('@virtality/ui/lib/use-resource-table') ||
      source.includes('useResourceTable'),
  ).toBe(true)
}

function expectFetchLoading(source: string) {
  expect(source).toMatch(/isPending/)
  expect(source).toMatch(/isLoading=\{isPending\}/)
}

describe('adminboard table kit migration', () => {
  it('imports shared table primitives in bucket browser', () => {
    const relativePath = 'components/bucket/bucket-browser.tsx'
    expectSharedTablePrimitives(readAdminboardFile(relativePath))
  })

  it.each([
    ['preset', 'components/resources/preset/preset-table.tsx'],
    ['exercises', 'components/resources/exercises/exercise-table.tsx'],
    ['tester-code', 'components/tester-code/tester-code-table.tsx'],
    [
      'trial-redeem-code',
      'components/trial-redeem-code/trial-redeem-code-table.tsx',
    ],
    [
      'coupon-library',
      'components/coupon-library/coupon-library-workspace.tsx',
    ],
    ['user', 'components/resources/user/user-table.tsx'],
    ['patients', 'components/resources/patients/patient-table.tsx'],
    ['map', 'components/resources/map/map-table.tsx'],
    ['avatar', 'components/resources/avatar/avatar-table.tsx'],
  ])(
    'migrates %s resource table to shared kit with fetch loading',
    (_, relativePath) => {
      const tableSource = readAdminboardFile(relativePath)

      expectSharedDataTableKit(tableSource)
      expectSharedTableConfiguration(tableSource)
      expectFetchLoading(tableSource)
      expect(tableSource).not.toMatch(/Loading\.\.\./)
    },
  )

  it('wires row navigation only on the preset resource table', () => {
    const presetSource = readAdminboardFile(
      'components/resources/preset/preset-table.tsx',
    )
    const exerciseSource = readAdminboardFile(
      'components/resources/exercises/exercise-table.tsx',
    )

    expect(presetSource).toMatch(/rowNavigation=\{rowNavigation\}/)
    expect(exerciseSource).not.toMatch(/rowNavigation/)
  })

  it('keeps preset exercise editor table free of fetch loading skeleton', () => {
    const tableSource = readAdminboardFile(
      'components/resources/preset/edit/preset-exercise-table.tsx',
    )

    expectSharedDataTableKit(tableSource)
    expectSharedTableConfiguration(tableSource)
    expect(tableSource).not.toMatch(/isLoading=/)
  })
})
