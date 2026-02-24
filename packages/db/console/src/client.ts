import { PrismaClient } from '../prisma/generated/client.ts'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: process.env.CONSOLE_DATABASE_URL,
})

const createPrismaClient = () => new PrismaClient({ adapter })
type PrismaClientSingleton = ReturnType<typeof createPrismaClient>

declare global {
  var __prismaConsole: PrismaClientSingleton | undefined
}

export const prisma = globalThis.__prismaConsole ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prismaConsole = prisma
}
