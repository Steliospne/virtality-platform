import { z } from 'zod/v4'

const required = z.string().trim().min(1)

const ConfigSchema = z.object({
  ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8080),
  WHATSAPP_VERIFY_TOKEN: required,
  WHATSAPP_APP_SECRET: required,
  WHATSAPP_ACCESS_TOKEN: required,
  WHATSAPP_PHONE_NUMBER_ID: required,
  WHATSAPP_GRAPH_API_VERSION: required.default('v23.0'),
  TEAM_BOT_ALLOWED_SENDERS: required,
  LINEAR_API_KEY: required,
  LINEAR_TEAM_ID: required,
})

export type Config = {
  env: 'development' | 'production'
  port: number
  whatsapp: {
    verifyToken: string
    appSecret: string
    accessToken: string
    phoneNumberId: string
    graphApiVersion: string
  }
  allowedSenders: ReadonlySet<string>
  linear: {
    apiKey: string
    teamId: string
  }
}

// WhatsApp sends `from` as digits only, so "+30 691 234 5678" in the env
// must compare equal to "306912345678".
function normalizeSender(value: string) {
  return value.replace(/\D/g, '')
}

export function loadConfig(env: Record<string, string | undefined>): Config {
  const parsed = ConfigSchema.safeParse(env)

  if (!parsed.success) {
    const missing = parsed.error.issues.map((issue) => issue.path.join('.'))
    throw new Error(`Invalid team-bot config: ${missing.join(', ')}`)
  }

  const values = parsed.data
  const allowedSenders = new Set(
    values.TEAM_BOT_ALLOWED_SENDERS.split(',')
      .map(normalizeSender)
      .filter(Boolean),
  )

  return {
    env: values.ENV,
    port: values.PORT,
    whatsapp: {
      verifyToken: values.WHATSAPP_VERIFY_TOKEN,
      appSecret: values.WHATSAPP_APP_SECRET,
      accessToken: values.WHATSAPP_ACCESS_TOKEN,
      phoneNumberId: values.WHATSAPP_PHONE_NUMBER_ID,
      graphApiVersion: values.WHATSAPP_GRAPH_API_VERSION,
    },
    allowedSenders,
    linear: {
      apiKey: values.LINEAR_API_KEY,
      teamId: values.LINEAR_TEAM_ID,
    },
  }
}
