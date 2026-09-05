import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const consoleRoot = fileURLToPath(new URL('..', import.meta.url))

function readConsoleFile(relativePath: string): string {
  return readFileSync(join(consoleRoot, relativePath), 'utf8')
}

describe('patient session history surfaces', () => {
  it('shows stored source program context in the sessions table', () => {
    const columnsSource = readConsoleFile(
      'app/(app)/patients/[patientId]/profile/_components/sessions-columns.tsx',
    )

    expect(columnsSource).toMatch(/getSessionSourceProgramDisplayName/)
    expect(columnsSource).toMatch(/header: \(\) => 'Program'/)
  })

  it('shows stored source program context in the session detail card', () => {
    const cardSource = readConsoleFile(
      'app/(app)/patients/[patientId]/profile/_components/session-card.tsx',
    )

    expect(cardSource).toMatch(/getSessionSourceProgramDisplayName/)
    expect(cardSource).not.toMatch(/programs\?\.find/)
  })

  it('reads performed exercises from the session exercise snapshot', () => {
    const cardSource = readConsoleFile(
      'app/(app)/patients/[patientId]/profile/_components/session-card.tsx',
    )

    expect(cardSource).toMatch(/session\.sessionExercise/)
    expect(cardSource).not.toMatch(/programExercise/)
  })

  it('loads clinical history from patient sessions without patient-program filters', () => {
    const tabSource = readConsoleFile(
      'app/(app)/patients/[patientId]/profile/_components/session-tab.tsx',
    )

    expect(tabSource).toMatch(/usePatientSessions/)
    expect(tabSource).toMatch(/usePatientSessionDateRange/)
    expect(tabSource).not.toMatch(/programId/)
  })

  it('uses start and end date pickers with persisted session ranges', () => {
    const overviewSource = readConsoleFile(
      'app/(app)/patients/[patientId]/profile/_components/sessions-overview.tsx',
    )

    expect(overviewSource).toMatch(/Start date/)
    expect(overviewSource).toMatch(/End date/)
    expect(overviewSource).toMatch(/DATE_RANGE_PRESET_LABELS/)
  })
})
