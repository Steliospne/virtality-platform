import { ORPCError } from '@orpc/server'
import { describe, expect, it } from 'vitest'
import { assertAdminRole } from './admin.ts'

describe('assertAdminRole', () => {
  it('rejects non-admin callers', () => {
    expect(() => assertAdminRole('user')).toThrow(ORPCError)
  })

  it('allows admin callers through', () => {
    expect(() => assertAdminRole('admin')).not.toThrow()
  })
})
