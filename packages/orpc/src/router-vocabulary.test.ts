import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const orpcRoot = dirname(fileURLToPath(import.meta.url))

function readOrpcFile(relativePath: string): string {
  return readFileSync(join(orpcRoot, relativePath), 'utf8')
}

describe('oRPC router vocabulary', () => {
  it('routes reusable program procedures at the top level without legacy program or preset namespaces', () => {
    const routerSource = readOrpcFile('router.ts')

    expect(routerSource).toMatch(/reusableProgram,/)
    expect(routerSource).toMatch(/reusableProgramExercise,/)
    expect(routerSource).not.toMatch(/legacy,/)
    expect(routerSource).not.toMatch(/^\s+program,/m)
    expect(routerSource).not.toMatch(/^\s+preset,/m)
    expect(routerSource).not.toMatch(/^\s+programExercise,/m)
    expect(routerSource).not.toMatch(/^\s+presetExercise,/m)
  })
})
