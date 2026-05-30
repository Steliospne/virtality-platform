import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const componentsDir = dirname(fileURLToPath(import.meta.url))

function readComponentSource(name: string) {
  return readFileSync(join(componentsDir, `${name}.tsx`), 'utf8')
}

describe('promoted card', () => {
  it('uses semantic tokens, not app-hardcoded palette classes', () => {
    const source = readComponentSource('card')
    expect(source).toContain('bg-card')
    expect(source).toContain('text-card-foreground')
    expect(source).toContain('text-muted-foreground')
    expect(source).not.toMatch(/\bzinc-\d+/)
  })
})
