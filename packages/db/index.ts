/**
 * @virtality/db – single entry point
 * Re-exports client, types, models, and Zod definitions (under `definitions`).
 */

export { prisma } from './src/client.js'
export * from './prisma/generated/client.js'
export type * from './prisma/generated/models.js'
