import { describe, expect, it } from 'vitest'
import {
  describeEmailAudienceRule,
  isEmailAudienceFormDirty,
  toEmailAudienceForm,
  toEmailAudienceInput,
  toggleEmailAudienceRole,
} from './email-audience-form'

const audience = {
  name: 'Clinics',
  description: null,
  rule: {
    includeUsers: true,
    userRoles: ['user' as const],
    includeWaitlist: false,
  },
  includeEmails: ['pin@example.com'],
  excludeEmails: [],
}

describe('email audience form', () => {
  it('round-trips an audience through the form state', () => {
    const form = toEmailAudienceForm(audience)
    expect(form.includeText).toBe('pin@example.com')
    expect(toEmailAudienceInput(form)).toEqual({
      name: 'Clinics',
      description: null,
      rule: audience.rule,
      includeEmails: ['pin@example.com'],
      excludeEmails: [],
    })
    expect(isEmailAudienceFormDirty(form, toEmailAudienceForm(audience))).toBe(
      false,
    )
  })

  it('toggles roles in and out', () => {
    expect(toggleEmailAudienceRole(['user'], 'admin')).toEqual([
      'user',
      'admin',
    ])
    expect(toggleEmailAudienceRole(['user', 'admin'], 'user')).toEqual([
      'admin',
    ])
  })

  it('summarises the rule', () => {
    expect(describeEmailAudienceRule(audience.rule, 1)).toBe(
      'Clinicians, 1 pinned',
    )
    expect(
      describeEmailAudienceRule(
        { includeUsers: true, userRoles: [], includeWaitlist: true },
        0,
      ),
    ).toBe('all registered users, waitlist')
    expect(
      describeEmailAudienceRule(
        { includeUsers: false, userRoles: [], includeWaitlist: false },
        0,
      ),
    ).toBe('No sources yet')
  })
})
