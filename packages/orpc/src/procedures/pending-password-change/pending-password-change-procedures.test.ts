import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const procedureRoot = dirname(fileURLToPath(import.meta.url))

function readProcedureFile(relativePath: string): string {
  return readFileSync(join(procedureRoot, relativePath), 'utf8')
}

function readProcedureBlock(source: string, exportName: string): string {
  return (
    source.match(
      new RegExp(
        `const ${exportName} = [\\s\\S]*?(?=\\nconst |\\nexport const)`,
      ),
    )?.[0] ?? ''
  )
}

function readZodObjectSchema(source: string, schemaName: string): string {
  return (
    source.match(
      new RegExp(`const ${schemaName} = z\\.object\\(\\{[\\s\\S]*?\\}\\)`),
    )?.[0] ?? ''
  )
}

function escapeRegex(value: string): string {
  return value.replace(/\//g, '\\/')
}

type ProcedureSpec = {
  exportName: string
  path: string
  method: string
  lifecycleFn: string
  inputSchema: string | null
  auth: 'authed' | 'base'
}

const PROCEDURES: ProcedureSpec[] = [
  {
    exportName: 'startSetup',
    path: '/pending-password-change/start-setup',
    method: 'POST',
    lifecycleFn: 'createPendingPasswordSetup',
    inputSchema: 'StartSetupInputSchema',
    auth: 'authed',
  },
  {
    exportName: 'startChange',
    path: '/pending-password-change/start-change',
    method: 'POST',
    lifecycleFn: 'createPendingPasswordChange',
    inputSchema: 'StartChangeInputSchema',
    auth: 'authed',
  },
  {
    exportName: 'getActive',
    path: '/pending-password-change/active',
    method: 'GET',
    lifecycleFn: 'getActivePendingPasswordChange',
    inputSchema: null,
    auth: 'authed',
  },
  {
    exportName: 'resend',
    path: '/pending-password-change/resend',
    method: 'POST',
    lifecycleFn: 'resendPendingPasswordChange',
    inputSchema: null,
    auth: 'authed',
  },
  {
    exportName: 'cancel',
    path: '/pending-password-change/cancel',
    method: 'POST',
    lifecycleFn: 'cancelPendingPasswordChange',
    inputSchema: null,
    auth: 'authed',
  },
  {
    exportName: 'inspect',
    path: '/pending-password-change/inspect',
    method: 'POST',
    lifecycleFn: 'inspectPendingPasswordChange',
    inputSchema: 'TokenInputSchema',
    auth: 'base',
  },
  {
    exportName: 'approve',
    path: '/pending-password-change/approve',
    method: 'POST',
    lifecycleFn: 'approvePendingPasswordChange',
    inputSchema: 'TokenInputSchema',
    auth: 'base',
  },
]

function expectProcedureRegistered(source: string, spec: ProcedureSpec) {
  const procedureBlock = readProcedureBlock(source, spec.exportName)

  expect(procedureBlock).toMatch(
    new RegExp(`path: '${escapeRegex(spec.path)}'`),
  )
  expect(procedureBlock).toMatch(new RegExp(`method: '${spec.method}'`))
  expect(procedureBlock).toMatch(new RegExp(`${spec.lifecycleFn}\\(`))
  if (spec.inputSchema) {
    expect(procedureBlock).toMatch(
      new RegExp(`\\.input\\(${spec.inputSchema}\\)`),
    )
  }
  expect(procedureBlock).toMatch(new RegExp(`= ${spec.auth}`))
}

describe('pending password change ORPC procedures', () => {
  const source = readProcedureFile('index.ts')

  it.each(PROCEDURES.filter((spec) => spec.auth === 'authed'))(
    'registers authenticated $exportName at $path',
    (spec) => {
      expectProcedureRegistered(source, spec)
    },
  )

  it.each(PROCEDURES.filter((spec) => spec.auth === 'base'))(
    'registers token-only $exportName at $path',
    (spec) => {
      expectProcedureRegistered(source, spec)
    },
  )

  it('requires current password for start-change but not start-setup', () => {
    const startSetupSchema = readZodObjectSchema(
      source,
      'StartSetupInputSchema',
    )
    const startChangeSchema = readZodObjectSchema(
      source,
      'StartChangeInputSchema',
    )

    expect(startChangeSchema).toMatch(/currentPassword/)
    expect(startChangeSchema).toMatch(/newPassword/)
    expect(startSetupSchema).toMatch(/newPassword/)
    expect(startSetupSchema).not.toMatch(/currentPassword/)
  })

  it('passes session id when starting setup or change', () => {
    expect(source).toMatch(/initiatingSessionId: session\.id/)
  })

  it('passes optional viewer user id to inspect', () => {
    expect(source).toMatch(/inspectPendingPasswordChange\([\s\S]*user\?\.id/)
  })

  it('builds approval URLs for the dedicated confirmation route', () => {
    expect(source).toMatch(/password-setup\/confirm\?token=/)
    expect(source).toMatch(/encodeURIComponent\(token\)/)
  })

  it.each(PROCEDURES)(
    'exports $exportName from the module',
    ({ exportName }) => {
      expect(source).toMatch(new RegExp(`${exportName},`))
    },
  )
})
