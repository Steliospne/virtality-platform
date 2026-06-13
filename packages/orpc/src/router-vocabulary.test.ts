import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const orpcRoot = dirname(fileURLToPath(import.meta.url))

function readOrpcFile(relativePath: string): string {
  return readFileSync(join(orpcRoot, relativePath), 'utf8')
}

describe('oRPC router vocabulary', () => {
  it('nests patient-program and preset procedures under legacy in the router', () => {
    const routerSource = readOrpcFile('router.ts')

    expect(routerSource).toMatch(/legacy,/)
    expect(routerSource).not.toMatch(/^\s+program,/m)
    expect(routerSource).not.toMatch(/^\s+preset,/m)
    expect(routerSource).not.toMatch(/^\s+programExercise,/m)
    expect(routerSource).not.toMatch(/^\s+presetExercise,/m)
    expect(routerSource).toMatch(/reusableProgram,/)
    expect(routerSource).toMatch(/reusableProgramExercise,/)
  })

  it('documents the legacy boundary in the legacy module', () => {
    const legacySource = readOrpcFile('procedures/legacy/index.ts')

    expect(legacySource).toMatch(/Pre–Reusable Program API/)
    expect(legacySource).toMatch(/reusableProgram/)
    expect(legacySource).toMatch(/program,/)
    expect(legacySource).toMatch(/preset,/)
  })
})
