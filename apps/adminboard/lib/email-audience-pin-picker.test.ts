import { describe, expect, it } from 'vitest'
import {
  appendEmailAudiencePin,
  filterEmailAudiencePinCandidates,
} from './email-audience-pin-picker'

const candidates = [
  { email: 'ana@clinic.com', name: 'Ana Physio', source: 'user' as const },
  { email: 'bob@clinic.com', name: 'Bob', source: 'user' as const },
  { email: 'wait@example.com', name: null, source: 'waitlist' as const },
]

describe('filterEmailAudiencePinCandidates', () => {
  it('matches on name or email and hides already pinned rows', () => {
    expect(
      filterEmailAudiencePinCandidates(candidates, 'physio', '').map(
        (c) => c.email,
      ),
    ).toEqual(['ana@clinic.com'])
    expect(
      filterEmailAudiencePinCandidates(
        candidates,
        'clinic',
        'BOB@clinic.com',
      ).map((c) => c.email),
    ).toEqual(['ana@clinic.com'])
    expect(filterEmailAudiencePinCandidates(candidates, '', '')).toHaveLength(3)
  })
})

describe('appendEmailAudiencePin', () => {
  it('appends on a new line and ignores duplicates', () => {
    expect(appendEmailAudiencePin('', 'a@x.com')).toBe('a@x.com')
    expect(appendEmailAudiencePin('a@x.com', 'b@x.com')).toBe(
      'a@x.com\nb@x.com',
    )
    expect(appendEmailAudiencePin('a@x.com', 'A@x.com')).toBe('a@x.com')
  })
})
