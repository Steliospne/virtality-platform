import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const componentsDir = dirname(fileURLToPath(import.meta.url))

function readComponentSource(name: string) {
  return readFileSync(join(componentsDir, `${name}.tsx`), 'utf8')
}

describe('promoted separator and badge', () => {
  it('separator uses semantic border token, not app-hardcoded palette classes', () => {
    const source = readComponentSource('separator')
    expect(source).toContain('bg-border')
    expect(source).not.toMatch(/\bzinc-\d+/)
  })

  it('badge uses semantic tokens, not app-hardcoded palette classes', () => {
    const source = readComponentSource('badge')
    expect(source).toContain('bg-primary')
    expect(source).toContain('text-primary-foreground')
    expect(source).not.toMatch(/\bzinc-\d+/)
  })
})
