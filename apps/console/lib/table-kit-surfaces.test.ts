import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

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

function expectSharedTableConfiguration(source: string) {
  expect(
    source.includes('@virtality/ui/lib/table-defaults') ||
      source.includes('@virtality/ui/lib/use-resource-table') ||
      source.includes('useResourceTable'),
  ).toBe(true)
}

function expectSharedDataTableKit(source: string) {
  expect(source).toMatch(/@virtality\/ui\/components\/data-table/)
  expectSharedTableConfiguration(source)
  expect(source).not.toMatch(/@\/components\/tables\/data-table/)
  expect(source).not.toMatch(/@\/components\/tables\/tanstack-table/)
}

function expectFetchLoading(source: string) {
  expect(source).toMatch(/isPending/)
  expect(source).toMatch(/isLoading=\{isPending\}/)
}

describe('console table kit migration', () => {
  it('migrates patients table to shared kit with fetch loading', () => {
    const tableSource = readConsoleFile(
      'app/(app)/patients/_components/patients-table.tsx',
    )

    expectSharedDataTableKit(tableSource)
    expectFetchLoading(tableSource)
  })

  it('migrates program library table to shared kit with fetch loading', () => {
    const tableSource = readConsoleFile(
      'app/(app)/programs/_components/program-library-table.tsx',
    )

    expectSharedDataTableKit(tableSource)
    expectFetchLoading(tableSource)
  })

  it('migrates sessions table to shared kit with parent-aware loading', () => {
    const tableSource = readConsoleFile(
      'app/(app)/patients/[patientId]/profile/_components/sessions-table.tsx',
    )

    expectSharedDataTableKit(tableSource)
    expect(tableSource).toMatch(/usesProvidedSessions/)
    expect(tableSource).toMatch(
      /isLoading=\{!usesProvidedSessions && isPending\}/,
    )
  })

  it('removes programs route-level table skeleton', () => {
    expect(pathExists('app/(app)/programs/loading.tsx')).toBe(false)
    expect(pathExists('components/tables/data-table-skeleton.tsx')).toBe(false)
  })

  it('imports table primitives from the shared UI bucket on forms page', () => {
    const formsSource = readConsoleFile('app/(app)/forms/page.tsx')

    expect(formsSource).toMatch(/@virtality\/ui\/components\/table/)
    expect(formsSource).not.toMatch(/@\/components\/ui\/table/)
  })

  it('removes console-local table kit copies', () => {
    expect(pathExists('components/tables/data-table.tsx')).toBe(false)
    expect(pathExists('components/tables/tanstack-table.ts')).toBe(false)
    expect(pathExists('components/tables/data-table-template.tsx')).toBe(false)
    expect(pathExists('components/ui/table.tsx')).toBe(false)
  })
})
