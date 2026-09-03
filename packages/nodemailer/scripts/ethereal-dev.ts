/**
 * Standalone dev task (run via `pnpm dev:ethereal`, wired into `dev:apps`)
 * that mints a throwaway Ethereal test account and persists it to
 * services/server/.env as SMTP_HOST/SMTP_USER/SMTP_PASS, so the inbox
 * survives server restarts instead of being reminted on every boot (see
 * packages/nodemailer/src/init.ts). Reuses whatever's already persisted
 * there instead of minting again.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as Nodemailer from 'nodemailer'
import open from 'open'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(scriptDir, '../../../services/server/.env')

function readEnvValue(content: string, key: string): string | undefined {
  const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'))
  const value = match?.[1]?.trim()
  return value || undefined
}

function upsertEnvValue(content: string, key: string, value: string): string {
  const line = `${key}=${value}`
  const pattern = new RegExp(`^#?\\s*${key}=.*$`, 'm')
  return pattern.test(content)
    ? content.replace(pattern, line)
    : `${content.replace(/\n?$/, '\n')}${line}\n`
}

async function main() {
  if (!existsSync(envPath)) {
    console.error(
      `[ethereal] ${envPath} does not exist. Copy services/server/.env.example to .env first.`,
    )
    process.exitCode = 1
    return
  }

  let content = readFileSync(envPath, 'utf8')
  const existingHost = readEnvValue(content, 'SMTP_HOST')
  const existingUser = readEnvValue(content, 'SMTP_USER')
  const existingPass = readEnvValue(content, 'SMTP_PASS')

  if (existingHost === 'smtp.ethereal.email' && existingUser && existingPass) {
    console.log(
      `[ethereal] Reusing persisted account "${existingUser}" / "${existingPass}". Log in at https://ethereal.email/login`,
    )
    return
  }

  const testAccount = await Nodemailer.createTestAccount()

  content = upsertEnvValue(content, 'EMAIL_LOCAL_TESTING', 'true')
  content = upsertEnvValue(content, 'SMTP_HOST', testAccount.smtp.host)
  content = upsertEnvValue(content, 'SMTP_USER', testAccount.user)
  content = upsertEnvValue(content, 'SMTP_PASS', testAccount.pass)
  writeFileSync(envPath, content)

  console.log(
    `[ethereal] Minted a new account and saved it to ${path.relative(process.cwd(), envPath)}`,
  )
  console.log(
    `[ethereal] Inbox: ${testAccount.web} - user "${testAccount.user}" / pass "${testAccount.pass}"`,
  )
  await open(testAccount.web)
}

await main()
