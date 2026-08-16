import 'dotenv/config'
import { prisma } from '../src/client.ts'
import { seedDevAdmin } from './seeds/dev-admin-seed.ts'
import { seedClinicalBootstrap } from './seeds/clinical-bootstrap-seed.ts'
import { DEV_ADMIN } from './seeds/dev-admin-constants.ts'

async function main() {
  const ownerUserId = await seedDevAdmin(prisma)
  await seedClinicalBootstrap(prisma, ownerUserId)
  console.log(
    `Seeded local admin ${DEV_ADMIN.email} / ${DEV_ADMIN.password} and clinical bootstrap data.`,
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
