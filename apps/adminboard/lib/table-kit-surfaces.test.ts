// @vitest-environment node

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const adminboardRoot = fileURLToPath(new URL('..', import.meta.url))

function readAdminboardFile(relativePath: string): string {
  return readFileSync(join(adminboardRoot, relativePath), 'utf8')
}

function pathExists(relativePath: string): boolean {
  try {
    readFileSync(join(adminboardRoot, relativePath))
    return true
  } catch {
    return false
  }
}

function expectSharedTablePrimitives(source: string) {
  expect(source).toMatch(/@virtality\/ui\/components\/table/)
  expect(source).not.toMatch(/@\/components\/ui\/table/)
}

describe('adminboard table kit migration', () => {
  it.each([
    ['bucket browser', 'components/bucket/bucket-browser.tsx'],
    ['inline-editable data-table', 'components/ui/data-table.tsx'],
  ])('imports shared table primitives in %s', (_, relativePath) => {
    expectSharedTablePrimitives(readAdminboardFile(relativePath))
  })

  it('removes adminboard-local table.tsx', () => {
    expect(pathExists('components/ui/table.tsx')).toBe(false)
  })
})
