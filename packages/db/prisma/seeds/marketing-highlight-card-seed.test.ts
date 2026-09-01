import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  buildMarketingHighlightCardSeedSql,
  MARKETING_HIGHLIGHT_CARD_SEED,
  validateMarketingHighlightCardSeed,
} from './marketing-highlight-card-seed.ts'

const migrationPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../migrations/20260721120000_add_marketing_highlight_card/migration.sql',
)

function readMigrationInsertSql(): string {
  const migration = readFileSync(migrationPath, 'utf8')
  const insertStart = migration.indexOf('INSERT INTO "MarketingHighlightCard"')

  if (insertStart === -1) {
    throw new Error(
      'expected marketing highlight card migration INSERT statement',
    )
  }

  return migration.slice(insertStart).trim()
}

describe('marketing highlight card seed', () => {
  it('keeps migration INSERT SQL aligned with the seed builder', () => {
    expect(buildMarketingHighlightCardSeedSql()).toBe(readMigrationInsertSql())
  })

  it('requires six ordered cards per collection', () => {
    expect(() =>
      validateMarketingHighlightCardSeed([
        {
          id: '11111111-1111-4111-8111-111111110001',
          collection: 'benefits',
          title: 'Benefit',
          body: 'Body',
          iconName: 'Shield',
          sortOrder: 0,
        },
      ]),
    ).toThrow(/6 benefits highlight cards/i)
  })

  it('requires contiguous sortOrder values starting at zero', () => {
    const records = MARKETING_HIGHLIGHT_CARD_SEED.map((record) => ({
      ...record,
    }))

    records[0]!.sortOrder = 2

    expect(() => validateMarketingHighlightCardSeed(records)).toThrow(
      /sortOrder/i,
    )
  })
})
