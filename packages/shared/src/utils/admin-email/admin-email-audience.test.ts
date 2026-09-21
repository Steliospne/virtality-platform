import { describe, expect, it } from 'vitest'
import {
  emailAudienceHasSource,
  parseEmailAudienceRuleJson,
  resolveEmailAudience,
  validateEmailAudiencePins,
} from './admin-email-audience.ts'

const sources = {
  users: [
    { email: 'Clinic@Example.com', role: 'user' },
    { email: 'admin@example.com', role: 'admin' },
    { email: 'tester@example.com', role: 'tester' },
    { email: 'legacy@example.com', role: null },
  ],
  waitlist: ['wait@example.com', 'clinic@example.com'],
}

describe('resolveEmailAudience', () => {
  it('combines rule sources, include pins and exclude pins without duplicates', () => {
    const resolved = resolveEmailAudience(
      {
        rule: { includeUsers: true, userRoles: [], includeWaitlist: true },
        includeEmails: ['Extra@example.com', 'wait@example.com'],
        excludeEmails: ['ADMIN@example.com'],
      },
      sources,
    )

    expect(resolved.recipients).toEqual([
      'clinic@example.com',
      'tester@example.com',
      'legacy@example.com',
      'wait@example.com',
      'extra@example.com',
    ])
    expect(resolved.fromUsers).toBe(3)
    expect(resolved.fromWaitlist).toBe(1)
    expect(resolved.fromIncludePins).toBe(1)
    expect(resolved.excludedByPins).toBe(1)
  })

  it('filters users by role and treats a missing role as user', () => {
    const resolved = resolveEmailAudience(
      {
        rule: {
          includeUsers: true,
          userRoles: ['user'],
          includeWaitlist: false,
        },
        includeEmails: [],
        excludeEmails: [],
      },
      sources,
    )

    expect(resolved.recipients).toEqual([
      'clinic@example.com',
      'legacy@example.com',
    ])
  })

  it('yields only pins when the rule includes no source', () => {
    const resolved = resolveEmailAudience(
      {
        rule: { includeUsers: false, userRoles: [], includeWaitlist: false },
        includeEmails: ['pin@example.com'],
        excludeEmails: [],
      },
      sources,
    )

    expect(resolved.recipients).toEqual(['pin@example.com'])
  })
})

describe('parseEmailAudienceRuleJson', () => {
  it('falls back to the empty rule for malformed JSON', () => {
    expect(parseEmailAudienceRuleJson('not json')).toEqual({
      includeUsers: false,
      userRoles: [],
      includeWaitlist: false,
    })
    expect(parseEmailAudienceRuleJson('{"includeUsers":true}')).toEqual({
      includeUsers: true,
      userRoles: [],
      includeWaitlist: false,
    })
  })
})

describe('validateEmailAudiencePins', () => {
  it('rejects invalid emails', () => {
    expect(validateEmailAudiencePins(['nope'], 'include')).toMatch(/invalid/)
    expect(validateEmailAudiencePins(['ok@example.com'], 'exclude')).toBeNull()
  })
})

describe('emailAudienceHasSource', () => {
  it('is false for an audience with no rule source and no include pins', () => {
    expect(
      emailAudienceHasSource(
        { includeUsers: false, userRoles: [], includeWaitlist: false },
        [],
      ),
    ).toBe(false)
    expect(
      emailAudienceHasSource(
        { includeUsers: false, userRoles: [], includeWaitlist: false },
        ['pin@example.com'],
      ),
    ).toBe(true)
  })
})
