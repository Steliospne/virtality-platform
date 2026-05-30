import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import {
  PROMOTED_COMPONENTS,
  isPromotedComponent,
  type PromotedComponent,
} from './index.ts'
import {
  SHARED_UI_CONSUMER_APPS,
  isDeprecatedReExportShim,
  localPromotedImportPatterns,
} from './enforcement.ts'

const contractDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(contractDir, '../../../..')
const appsRoot = join(repoRoot, 'apps')

function listSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir)
  const files: string[] = []
  for (const entry of entries) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry === '.next') continue
      files.push(...listSourceFiles(fullPath))
      continue
    }
    if (/\.(tsx?|jsx?)$/.test(entry)) files.push(fullPath)
  }
  return files
}

function promotedShimPath(app: string, name: PromotedComponent): string {
  return join(appsRoot, app, 'components/ui', `${name}.tsx`)
}

function isPromotedShimFile(filePath: string): PromotedComponent | null {
  for (const app of SHARED_UI_CONSUMER_APPS) {
    const prefix = join(appsRoot, app, 'components/ui') + '/'
    if (!filePath.startsWith(prefix)) continue
    const base = filePath.slice(prefix.length)
    const match = /^([a-z]+)\.tsx$/.exec(base)
    const name = match?.[1]
    if (name && isPromotedComponent(name)) {
      return name
    }
  }
  return null
}

describe('shared UI import enforcement', () => {
  it('declares patterns for every promoted component', () => {
    expect(localPromotedImportPatterns()).toHaveLength(
      PROMOTED_COMPONENTS.length,
    )
  })

  it('forbids local imports of promoted components in consumer apps', () => {
    const patterns = localPromotedImportPatterns()
    const violations: string[] = []

    for (const app of SHARED_UI_CONSUMER_APPS) {
      const appDir = join(appsRoot, app)
      for (const file of listSourceFiles(appDir)) {
        const promotedShim = isPromotedShimFile(file)
        if (promotedShim) continue

        const source = readFileSync(file, 'utf8')
        for (const pattern of patterns) {
          if (pattern.test(source)) {
            violations.push(`${file}: matches ${pattern}`)
          }
        }
      }
    }

    expect(violations).toEqual([])
  })

  it('requires deprecated local shims to be re-export only', () => {
    const violations: string[] = []

    for (const app of SHARED_UI_CONSUMER_APPS) {
      for (const name of PROMOTED_COMPONENTS) {
        const shimPath = promotedShimPath(app, name)
        let source: string
        try {
          source = readFileSync(shimPath, 'utf8')
        } catch {
          continue
        }
        if (!isDeprecatedReExportShim(source, name)) {
          violations.push(shimPath)
        }
      }
    }

    expect(violations).toEqual([])
  })
})
