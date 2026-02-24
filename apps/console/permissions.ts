import { createAccessControl } from 'better-auth/plugins/access'
import {
  defaultRoles,
  defaultStatements,
  userAc,
} from 'better-auth/plugins/admin/access'

const statement = {
  ...defaultStatements,
} as const

export const ac = createAccessControl(statement)

export const tester = ac.newRole({ ...userAc.statements })

export const roles = { ...defaultRoles, tester }
