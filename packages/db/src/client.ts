import { PrismaClient } from '../prisma/generated/client.js'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

const createPrismaClient = () => new PrismaClient({ adapter })
type PrismaClientSingleton = ReturnType<typeof createPrismaClient>

declare global {
  var __prisma: PrismaClientSingleton | undefined
}

export const prisma = globalThis.__prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}
