import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const procedureRoot = dirname(fileURLToPath(import.meta.url))

function readProcedureFile(relativePath: string): string {
  return readFileSync(join(procedureRoot, relativePath), 'utf8')
}

const PROCEDURE_INDEX = 'index.ts'

const AUTHENTICATED_PROCEDURES = [
  {
    exportName: 'startSetup',
    path: '/pending-password-change/start-setup',
    method: 'POST',
    lifecycleFn: 'createPendingPasswordSetup',
    inputSchema: 'StartSetupInputSchema',
  },
  {
    exportName: 'startChange',
    path: '/pending-password-change/start-change',
    method: 'POST',
    lifecycleFn: 'createPendingPasswordChange',
    inputSchema: 'StartChangeInputSchema',
  },
  {
    exportName: 'getActive',
    path: '/pending-password-change/active',
    method: 'GET',
    lifecycleFn: 'getActivePendingPasswordChange',
    inputSchema: null,
  },
  {
    exportName: 'resend',
    path: '/pending-password-change/resend',
    method: 'POST',
    lifecycleFn: 'resendPendingPasswordChange',
    inputSchema: null,
  },
  {
    exportName: 'cancel',
    path: '/pending-password-change/cancel',
    method: 'POST',
    lifecycleFn: 'cancelPendingPasswordChange',
    inputSchema: null,
  },
] as const

const TOKEN_ONLY_PROCEDURES = [
  {
    exportName: 'inspect',
    path: '/pending-password-change/inspect',
    method: 'POST',
    lifecycleFn: 'inspectPendingPasswordChange',
    inputSchema: 'TokenInputSchema',
  },
  {
    exportName: 'approve',
    path: '/pending-password-change/approve',
    method: 'POST',
    lifecycleFn: 'approvePendingPasswordChange',
    inputSchema: 'TokenInputSchema',
  },
] as const

function readProcedureBlock(source: string, exportName: string): string {
  return (
    source.match(
      new RegExp(
        `const ${exportName} = [\\s\\S]*?(?=\\nconst |\\nexport const)`,
      ),
    )?.[0] ?? ''
  )
}

describe('pending password change ORPC procedures', () => {
  const source = readProcedureFile(PROCEDURE_INDEX)

  it.each(AUTHENTICATED_PROCEDURES)(
    'registers authenticated $exportName at $path',
    ({ exportName, path, method, lifecycleFn, inputSchema }) => {
      const procedureBlock = readProcedureBlock(source, exportName)

      expect(procedureBlock).toMatch(
        new RegExp(`path: '${path.replace(/\//g, '\\/')}'`),
      )
      expect(procedureBlock).toMatch(new RegExp(`method: '${method}'`))
      expect(procedureBlock).toMatch(new RegExp(`${lifecycleFn}\\(`))
      if (inputSchema) {
        expect(procedureBlock).toMatch(
          new RegExp(`\\.input\\(${inputSchema}\\)`),
        )
      }
      expect(procedureBlock).toMatch(/= authed/)
    },
  )

  it.each(TOKEN_ONLY_PROCEDURES)(
    'registers token-only $exportName at $path',
    ({ exportName, path, method, lifecycleFn, inputSchema }) => {
      const procedureBlock = readProcedureBlock(source, exportName)

      expect(procedureBlock).toMatch(
        new RegExp(`path: '${path.replace(/\//g, '\\/')}'`),
      )
      expect(procedureBlock).toMatch(new RegExp(`method: '${method}'`))
      expect(procedureBlock).toMatch(new RegExp(`\\.input\\(${inputSchema}\\)`))
      expect(procedureBlock).toMatch(new RegExp(`${lifecycleFn}\\(`))
      expect(procedureBlock).toMatch(/= base/)
    },
  )

  it('requires current password for start-change but not start-setup', () => {
    const startSetupSchema =
      source.match(
        /const StartSetupInputSchema = z\.object\(\{[\s\S]*?\}\)/,
      )?.[0] ?? ''
    const startChangeSchema =
      source.match(
        /const StartChangeInputSchema = z\.object\(\{[\s\S]*?\}\)/,
      )?.[0] ?? ''

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

  it('exports all profile and approval procedures from the module', () => {
    for (const { exportName } of [
      ...AUTHENTICATED_PROCEDURES,
      ...TOKEN_ONLY_PROCEDURES,
    ]) {
      expect(source).toMatch(new RegExp(`${exportName},`))
    }
  })
})
