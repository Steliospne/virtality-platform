import { describe, expect, it } from 'vitest'
import {
  resolveAvatarSex,
  resolveDashboardAvatar,
} from './patient-dashboard-avatar-selection.js'

const avatars = [
  { id: 'avatar-male-1', name: 'Alex' },
  { id: 'avatar-female-1', name: 'Jordan' },
  { id: 'avatar-neutral-1', name: 'Sam' },
]

describe('resolveAvatarSex', () => {
  it('uses explicit sex when present', () => {
    expect(resolveAvatarSex({ id: 'a1', name: 'Alex', sex: 'female' })).toBe(
      'female',
    )
  })

  it('infers female before male to avoid substring matches', () => {
    expect(resolveAvatarSex({ id: 'avatar-female-1', name: 'Jordan' })).toBe(
      'female',
    )
  })

  it('infers male from id or name', () => {
    expect(resolveAvatarSex({ id: 'avatar-male-1', name: 'Alex' })).toBe('male')
  })

  it('returns null for neutral avatars', () => {
    expect(resolveAvatarSex({ id: 'avatar-neutral-1', name: 'Sam' })).toBeNull()
  })
})

describe('resolveDashboardAvatar', () => {
  it('uses a locally saved avatar regardless of patient sex', () => {
    expect(
      resolveDashboardAvatar({
        avatars,
        lastAvatarId: 'avatar-female-1',
        patientSex: 'male',
      }),
    ).toEqual(avatars[1])
  })

  it('preselects a sex-matching avatar when nothing is saved locally', () => {
    expect(
      resolveDashboardAvatar({
        avatars,
        lastAvatarId: undefined,
        patientSex: 'female',
      }),
    ).toEqual(avatars[1])
  })

  it('falls back to the first avatar when patient sex has no match', () => {
    expect(
      resolveDashboardAvatar({
        avatars: [{ id: 'avatar-neutral-1', name: 'Sam' }],
        lastAvatarId: undefined,
        patientSex: 'male',
      }),
    ).toEqual({ id: 'avatar-neutral-1', name: 'Sam' })
  })

  it('defaults to the first avatar when patient sex is other or unset', () => {
    expect(
      resolveDashboardAvatar({
        avatars,
        lastAvatarId: undefined,
        patientSex: 'other',
      }),
    ).toEqual(avatars[0])

    expect(
      resolveDashboardAvatar({
        avatars,
        lastAvatarId: undefined,
        patientSex: null,
      }),
    ).toEqual(avatars[0])
  })
})
