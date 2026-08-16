import 'dotenv/config'
import type { PrismaConfig } from 'prisma'
import { env } from 'prisma/config'

export default {
  schema: './prisma',
  migrations: {
    path: './prisma/migrations',
    // Prisma 7 no longer auto-seeds on migrate/reset; package scripts chain
    // `prisma db seed` after those commands.
    seed: 'tsx ./console/prisma/seed.ts',
  },
  datasource: { url: env('CONSOLE_DATABASE_URL') },
} satisfies PrismaConfig
