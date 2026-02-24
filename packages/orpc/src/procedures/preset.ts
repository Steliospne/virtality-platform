import {
  PresetFindManyZodSchema,
  PresetSchema,
} from '@virtality/db/definitions'
import { authed } from '../middleware/auth.ts'

const listPreset = authed
  .route({ path: '/preset/list', method: 'GET' })
  .handler(async ({ context }) => {
    const { prisma } = context
    const presets = await prisma.preset.findMany({
      where: {
        userId: null,
        AND: [{ deletedAt: null }],
      },
      include: { presetExercise: true },
    })
    return presets
  })

const listUserPresets = authed
  .route({ path: '/preset/list-user', method: 'GET' })
  .input(PresetFindManyZodSchema.optional())
  .handler(async ({ context, input }) => {
    const { prisma, user } = context
    const presets = await prisma.preset.findMany({
      where: { userId: user.id, AND: [{ deletedAt: null }], ...input?.where },
      orderBy: input?.orderBy,
      skip: input?.skip,
      take: input?.take,
      include: { presetExercise: true },
    })
    return presets
  })

const findPreset = authed
  .route({ path: '/preset/find', method: 'GET' })
  .input(PresetSchema.pick({ id: true }))
  .handler(async ({ context, input }) => {
    const { prisma } = context
    const preset = await prisma.preset.findFirst({
      where: { id: input.id },
      include: { presetExercise: true },
    })
    return preset
  })

const createPreset = authed
  .route({ path: '/preset/create', method: 'POST' })
  .input(PresetSchema)
  .handler(async ({ context, input }) => {
    const { prisma } = context
    const preset = await prisma.preset.create({ data: input })
    return preset
  })

const updatePreset = authed
  .route({ path: '/preset/update', method: 'PUT' })
  .input(PresetSchema)
  .handler(async ({ context, input }) => {
    const { prisma } = context
    const preset = await prisma.preset.update({
      where: { id: input.id },
      data: input,
    })
    return preset
  })

const deletePreset = authed
  .route({ path: '/preset/delete', method: 'DELETE' })
  .input(PresetSchema.pick({ id: true }))
  .handler(async ({ context, input }) => {
    const { prisma } = context
    await prisma.preset.update({
      where: { id: input.id },
      data: { deletedAt: new Date() },
    })
  })

export const preset = {
  list: listPreset,
  listUser: listUserPresets,
  find: findPreset,
  create: createPreset,
  update: updatePreset,
  delete: deletePreset,
}
