/**
 * @virtality/db – single entry point
 * Re-exports console client, types, models, and Zod definitions (under `definitions`).
 */

export { prisma } from './console/src/client.js'
export * from './console/prisma/generated/client.js'
export type * from './console/prisma/generated/models.js'
