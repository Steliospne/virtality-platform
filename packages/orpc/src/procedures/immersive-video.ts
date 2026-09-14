import { Buffer } from 'node:buffer'
import { ORPCError } from '@orpc/server'
import { z } from 'zod/v4'
import { authed } from '../middleware/auth.ts'
import { adminAuthed } from '../middleware/admin.ts'
import {
  ImmersiveVideoError,
  ImmersiveVideoNotFoundError,
} from './immersive-video-constants.ts'
import { createImmersiveVideoS3 } from './immersive-video-s3.ts'
import {
  listAddressablesCatalogReleases,
  uploadAddressablesCatalog,
} from './addressables-catalog-service.ts'
import {
  abortImmersiveVideoUpload,
  completeImmersiveVideoUpload,
  createImmersiveVideo,
  deleteImmersiveVideo,
  discardImmersiveVideoIfEmpty,
  getImmersiveVideo,
  immersiveVideoUploadStatus,
  listImmersiveVideoCatalog,
  listPublishedImmersiveVideos,
  publishImmersiveVideo,
  setImmersiveVideoThumbnail,
  startImmersiveVideoUpload,
  unpublishImmersiveVideo,
  updateImmersiveVideo,
  uploadImmersiveVideoPart,
  type ImmersiveVideoPrisma,
} from './immersive-video-service.ts'

const idInput = z.object({ id: z.string().min(1) })

const updateInput = z.object({
  id: z.string().min(1),
  title: z.string().max(120).optional(),
  activity: z.enum(['CYCLING', 'WALKING']).optional(),
  description: z.string().max(500).nullable().optional(),
})

const thumbnailInput = z.object({
  id: z.string().min(1),
  file: z.instanceof(File),
})

const uploadStartInput = z.object({
  id: z.string().min(1),
  /** Admin-chosen Video ID; blank keeps the generated one. Only honoured on the first upload. */
  videoId: z.string().max(64).nullable().optional(),
  filename: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
  durationSec: z.number().int().nonnegative().nullable().optional(),
})

const catalogUploadInput = z.object({
  catalog: z.instanceof(File),
  hash: z.instanceof(File),
})

const uploadPartInput = z.object({
  id: z.string().min(1),
  partNumber: z.number().int().positive(),
  part: z.instanceof(File),
})

function throwImmersiveVideoOrpcError(error: unknown): never {
  if (error instanceof ImmersiveVideoNotFoundError) {
    throw new ORPCError('NOT_FOUND', { message: error.message })
  }
  if (error instanceof ImmersiveVideoError) {
    throw new ORPCError('BAD_REQUEST', { message: error.message })
  }
  throw error
}

async function withImmersiveVideoErrors<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run()
  } catch (error) {
    throwImmersiveVideoOrpcError(error)
  }
}

function depsFromContext(context: {
  prisma: ImmersiveVideoPrisma
  s3: Parameters<typeof createImmersiveVideoS3>[0]
}) {
  return {
    prisma: context.prisma,
    s3: createImmersiveVideoS3(context.s3),
  }
}

const list = authed
  .route({ path: '/immersive-video/list', method: 'GET' })
  .handler(async ({ context }) => ({
    videos: await listPublishedImmersiveVideos(context.prisma),
  }))

const listCatalog = adminAuthed
  .route({ path: '/immersive-video/list-catalog', method: 'GET' })
  .handler(async ({ context }) =>
    withImmersiveVideoErrors(() =>
      listImmersiveVideoCatalog(depsFromContext(context)),
    ),
  )

const get = adminAuthed
  .route({ path: '/immersive-video/get', method: 'GET' })
  .input(idInput)
  .handler(async ({ context, input }) =>
    withImmersiveVideoErrors(() =>
      getImmersiveVideo(depsFromContext(context), input.id),
    ),
  )

const create = adminAuthed
  .route({ path: '/immersive-video/create', method: 'POST' })
  .handler(async ({ context }) =>
    withImmersiveVideoErrors(() =>
      createImmersiveVideo(depsFromContext(context)),
    ),
  )

const update = adminAuthed
  .route({ path: '/immersive-video/update', method: 'POST' })
  .input(updateInput)
  .handler(async ({ context, input }) =>
    withImmersiveVideoErrors(() =>
      updateImmersiveVideo(depsFromContext(context), input),
    ),
  )

const setThumbnail = adminAuthed
  .route({ path: '/immersive-video/set-thumbnail', method: 'POST' })
  .input(thumbnailInput)
  .handler(async ({ context, input }) =>
    withImmersiveVideoErrors(() =>
      setImmersiveVideoThumbnail(depsFromContext(context), input),
    ),
  )

const discardIfEmpty = adminAuthed
  .route({ path: '/immersive-video/discard-if-empty', method: 'POST' })
  .input(idInput)
  .handler(async ({ context, input }) =>
    withImmersiveVideoErrors(() =>
      discardImmersiveVideoIfEmpty(depsFromContext(context), input.id),
    ),
  )

const publish = adminAuthed
  .route({ path: '/immersive-video/publish', method: 'POST' })
  .input(idInput)
  .handler(async ({ context, input }) =>
    withImmersiveVideoErrors(() =>
      publishImmersiveVideo(depsFromContext(context), input.id),
    ),
  )

const unpublish = adminAuthed
  .route({ path: '/immersive-video/unpublish', method: 'POST' })
  .input(idInput)
  .handler(async ({ context, input }) =>
    withImmersiveVideoErrors(() =>
      unpublishImmersiveVideo(depsFromContext(context), input.id),
    ),
  )

const remove = adminAuthed
  .route({ path: '/immersive-video/delete', method: 'DELETE' })
  .input(idInput)
  .handler(async ({ context, input }) =>
    withImmersiveVideoErrors(() =>
      deleteImmersiveVideo(depsFromContext(context), input.id),
    ),
  )

const uploadStart = adminAuthed
  .route({ path: '/immersive-video/upload/start', method: 'POST' })
  .input(uploadStartInput)
  .handler(async ({ context, input }) =>
    withImmersiveVideoErrors(() =>
      startImmersiveVideoUpload(depsFromContext(context), input),
    ),
  )

const uploadPart = adminAuthed
  .route({ path: '/immersive-video/upload/part', method: 'POST' })
  .input(uploadPartInput)
  .handler(async ({ context, input }) =>
    withImmersiveVideoErrors(() =>
      uploadImmersiveVideoPart(depsFromContext(context), input),
    ),
  )

const uploadStatus = adminAuthed
  .route({ path: '/immersive-video/upload/status', method: 'GET' })
  .input(idInput)
  .handler(async ({ context, input }) =>
    withImmersiveVideoErrors(() =>
      immersiveVideoUploadStatus(depsFromContext(context), input.id),
    ),
  )

const uploadComplete = adminAuthed
  .route({ path: '/immersive-video/upload/complete', method: 'POST' })
  .input(idInput)
  .handler(async ({ context, input }) =>
    withImmersiveVideoErrors(() =>
      completeImmersiveVideoUpload(depsFromContext(context), input.id),
    ),
  )

const uploadAbort = adminAuthed
  .route({ path: '/immersive-video/upload/abort', method: 'POST' })
  .input(idInput)
  .handler(async ({ context, input }) =>
    withImmersiveVideoErrors(() =>
      abortImmersiveVideoUpload(depsFromContext(context), input.id),
    ),
  )

const catalogList = adminAuthed
  .route({ path: '/immersive-video/addressables-catalog/list', method: 'GET' })
  .handler(async ({ context }) =>
    listAddressablesCatalogReleases(depsFromContext(context).s3),
  )

const catalogUpload = adminAuthed
  .route({
    path: '/immersive-video/addressables-catalog/upload',
    method: 'POST',
  })
  .input(catalogUploadInput)
  .handler(async ({ context, input }) =>
    withImmersiveVideoErrors(async () =>
      uploadAddressablesCatalog(depsFromContext(context).s3, {
        catalog: {
          filename: input.catalog.name,
          body: Buffer.from(await input.catalog.arrayBuffer()),
        },
        hash: {
          filename: input.hash.name,
          body: Buffer.from(await input.hash.arrayBuffer()),
        },
      }),
    ),
  )

export const immersiveVideo = {
  list,
  listCatalog,
  get,
  create,
  update,
  setThumbnail,
  discardIfEmpty,
  publish,
  unpublish,
  delete: remove,
  upload: {
    start: uploadStart,
    part: uploadPart,
    status: uploadStatus,
    complete: uploadComplete,
    abort: uploadAbort,
  },
  addressablesCatalog: {
    list: catalogList,
    upload: catalogUpload,
  },
}
