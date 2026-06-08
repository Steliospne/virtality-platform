import { ORPCError } from '@orpc/server'
import { createAppLogger } from '@virtality/shared/observability'
import {
  collectObjectKeysUnderPrefix,
  deleteBucketObject,
  deleteFolderPrefix,
  findKnownBucketFolderReferences,
  findKnownBucketObjectReferences,
  formatBucketListPage,
  getBucketObjectDetails,
  moveBucketObject,
  moveFolderPrefix,
  normalizeBucketPrefix,
  replaceBucketObject,
  uploadBucketObjects,
} from '@virtality/shared/utils'
import { Buffer } from 'node:buffer'
import { z } from 'zod'
import { authed } from '../middleware/auth.ts'
import { createPrismaBucketReferenceReader } from './bucket-reference-reader.ts'

const bucketLogger = createAppLogger({
  serviceName: 'server',
  defaultAttributes: {
    component: 'bucket',
  },
})

const BucketListInput = z.object({
  prefix: z.string().optional().default(''),
  continuationToken: z.string().optional(),
})

const BucketUploadInput = z.object({
  targetPrefix: z.string().optional().default(''),
  files: z.array(z.instanceof(File)).min(1),
})

const BucketMoveInput = z.object({
  sourceObjectKey: z.string().min(1),
  destinationObjectKey: z.string().min(1),
})

const BucketDeleteInput = z.object({
  objectKey: z.string().min(1),
})

const BucketReplaceInput = z.object({
  sourceObjectKey: z.string().min(1),
  file: z.instanceof(File),
  deleteOldObject: z.boolean().optional().default(false),
})

const BucketReferencesInput = z.object({
  objectKey: z.string().min(1),
})

const BucketObjectDetailsInput = z.object({
  objectKey: z.string().min(1),
})

const BucketFolderPreviewInput = z.object({
  sourcePrefix: z.string().min(1),
})

const BucketFolderMoveInput = z.object({
  sourcePrefix: z.string().min(1),
  destinationPrefix: z.string().min(1),
})

const BucketFolderDeleteInput = z.object({
  sourcePrefix: z.string().min(1),
})

const listBucketPrefix = authed
  .route({ path: '/bucket/list', method: 'GET' })
  .input(BucketListInput)
  .handler(async ({ context, input }) => {
    const { s3 } = context
    const prefix = normalizeBucketPrefix(input.prefix ?? '')
    const result = await s3.listPrefix({
      prefix,
      continuationToken: input.continuationToken,
    })

    return formatBucketListPage(prefix, result)
  })

const uploadBucket = authed
  .route({ path: '/bucket/upload', method: 'POST' })
  .input(BucketUploadInput)
  .handler(async ({ context, input }) => {
    const { s3, user } = context
    const fileInputs = await Promise.all(
      input.files.map(async (file) => ({
        name: file.name,
        contentType: file.type,
        body: Buffer.from(await file.arrayBuffer()),
      })),
    )

    let outcome
    try {
      outcome = await uploadBucketObjects({
        s3,
        targetPrefix: input.targetPrefix ?? '',
        files: fileInputs,
      })
    } catch (error) {
      bucketLogger.warn('bucket.upload.rejected', {
        actorId: user.id,
        targetPrefix: input.targetPrefix ?? '',
        error,
      })
      throw new ORPCError('BAD_REQUEST', {
        message:
          error instanceof Error ? error.message : 'Invalid bucket upload',
      })
    }

    bucketLogger.info('bucket.upload.completed', {
      actorId: user.id,
      targetPrefix: normalizeBucketPrefix(input.targetPrefix ?? ''),
      uploadedObjectKeys: outcome.uploads.map((upload) => upload.objectKey),
      uploadedCount: outcome.uploads.length,
      failureCount: outcome.failures.length,
      failures: outcome.failures,
    })

    return outcome
  })

const moveBucket = authed
  .route({ path: '/bucket/move', method: 'POST' })
  .input(BucketMoveInput)
  .handler(async ({ context, input }) => {
    const { s3, user } = context

    try {
      const outcome = await moveBucketObject({
        s3,
        sourceObjectKey: input.sourceObjectKey,
        destinationObjectKey: input.destinationObjectKey,
      })

      bucketLogger.info('bucket.move.completed', {
        actorId: user.id,
        sourceObjectKey: outcome.sourceObjectKey,
        destinationObjectKey: outcome.destinationObjectKey,
      })

      return outcome
    } catch (error) {
      bucketLogger.warn('bucket.move.failed', {
        actorId: user.id,
        sourceObjectKey: input.sourceObjectKey,
        destinationObjectKey: input.destinationObjectKey,
        error,
      })

      throw new ORPCError('BAD_REQUEST', {
        message:
          error instanceof Error ? error.message : 'Bucket move failed',
      })
    }
  })

const deleteBucket = authed
  .route({ path: '/bucket/delete', method: 'DELETE' })
  .input(BucketDeleteInput)
  .handler(async ({ context, input }) => {
    const { s3, user } = context

    try {
      const outcome = await deleteBucketObject({
        s3,
        objectKey: input.objectKey,
      })

      bucketLogger.info('bucket.delete.completed', {
        actorId: user.id,
        objectKey: outcome.objectKey,
      })

      return outcome
    } catch (error) {
      bucketLogger.warn('bucket.delete.failed', {
        actorId: user.id,
        objectKey: input.objectKey,
        error,
      })

      throw new ORPCError('BAD_REQUEST', {
        message:
          error instanceof Error ? error.message : 'Bucket delete failed',
      })
    }
  })

const replaceBucket = authed
  .route({ path: '/bucket/replace', method: 'POST' })
  .input(BucketReplaceInput)
  .handler(async ({ context, input }) => {
    const { s3, user } = context
    const fileInput = {
      name: input.file.name,
      contentType: input.file.type,
      body: Buffer.from(await input.file.arrayBuffer()),
    }

    try {
      const outcome = await replaceBucketObject({
        s3,
        sourceObjectKey: input.sourceObjectKey,
        file: fileInput,
        deleteOldObject: input.deleteOldObject,
      })

      bucketLogger.info('bucket.replace.completed', {
        actorId: user.id,
        oldObjectKey: outcome.oldObjectKey,
        newObjectKey: outcome.newObjectKey,
        oldObjectDeleted: outcome.oldObjectDeleted,
      })

      return outcome
    } catch (error) {
      bucketLogger.warn('bucket.replace.failed', {
        actorId: user.id,
        sourceObjectKey: input.sourceObjectKey,
        deleteOldObject: input.deleteOldObject,
        error,
      })

      throw new ORPCError('BAD_REQUEST', {
        message:
          error instanceof Error ? error.message : 'Bucket replace failed',
      })
    }
  })

const getBucketObjectDetailsProcedure = authed
  .route({ path: '/bucket/details', method: 'GET' })
  .input(BucketObjectDetailsInput)
  .handler(async ({ context, input }) => {
    const { s3 } = context

    try {
      return await getBucketObjectDetails({
        s3,
        objectKey: input.objectKey,
      })
    } catch (error) {
      throw new ORPCError('BAD_REQUEST', {
        message:
          error instanceof Error
            ? error.message
            : 'Invalid bucket object details request',
      })
    }
  })

const getBucketObjectReferences = authed
  .route({ path: '/bucket/references', method: 'GET' })
  .input(BucketReferencesInput)
  .handler(async ({ context, input }) => {
    return findKnownBucketObjectReferences({
      reader: createPrismaBucketReferenceReader(context.prisma),
      objectKey: input.objectKey,
    })
  })

const previewBucketFolder = authed
  .route({ path: '/bucket/folder/preview', method: 'GET' })
  .input(BucketFolderPreviewInput)
  .handler(async ({ context, input }) => {
    const { s3 } = context
    const sourcePrefix = normalizeBucketPrefix(input.sourcePrefix)
    const objectKeys = await collectObjectKeysUnderPrefix(s3, sourcePrefix)
    const referencedObjects = await findKnownBucketFolderReferences({
      reader: createPrismaBucketReferenceReader(context.prisma),
      objectKeys,
    })

    return {
      sourcePrefix,
      objectCount: objectKeys.length,
      referencedObjects,
    }
  })

const moveBucketFolder = authed
  .route({ path: '/bucket/folder/move', method: 'POST' })
  .input(BucketFolderMoveInput)
  .handler(async ({ context, input }) => {
    const { s3, user } = context

    try {
      const outcome = await moveFolderPrefix({
        s3,
        sourcePrefix: input.sourcePrefix,
        destinationPrefix: input.destinationPrefix,
      })

      bucketLogger.info('bucket.folder.move.completed', {
        actorId: user.id,
        sourcePrefix: outcome.sourcePrefix,
        destinationPrefix: outcome.destinationPrefix,
        objectCount: outcome.objectCount,
        successCount: outcome.successes.length,
        failureCount: outcome.failures.length,
        failures: outcome.failures,
      })

      return outcome
    } catch (error) {
      bucketLogger.warn('bucket.folder.move.failed', {
        actorId: user.id,
        sourcePrefix: input.sourcePrefix,
        destinationPrefix: input.destinationPrefix,
        error,
      })

      throw new ORPCError('BAD_REQUEST', {
        message:
          error instanceof Error ? error.message : 'Folder move failed',
      })
    }
  })

const deleteBucketFolder = authed
  .route({ path: '/bucket/folder/delete', method: 'DELETE' })
  .input(BucketFolderDeleteInput)
  .handler(async ({ context, input }) => {
    const { s3, user } = context

    try {
      const outcome = await deleteFolderPrefix({
        s3,
        sourcePrefix: input.sourcePrefix,
      })

      bucketLogger.info('bucket.folder.delete.completed', {
        actorId: user.id,
        sourcePrefix: outcome.sourcePrefix,
        objectCount: outcome.objectCount,
        successCount: outcome.successes.length,
        failureCount: outcome.failures.length,
        failures: outcome.failures,
      })

      return outcome
    } catch (error) {
      bucketLogger.warn('bucket.folder.delete.failed', {
        actorId: user.id,
        sourcePrefix: input.sourcePrefix,
        error,
      })

      throw new ORPCError('BAD_REQUEST', {
        message:
          error instanceof Error ? error.message : 'Folder delete failed',
      })
    }
  })

export const bucket = {
  list: listBucketPrefix,
  upload: uploadBucket,
  move: moveBucket,
  delete: deleteBucket,
  replace: replaceBucket,
  details: getBucketObjectDetailsProcedure,
  references: getBucketObjectReferences,
  folderPreview: previewBucketFolder,
  folderMove: moveBucketFolder,
  folderDelete: deleteBucketFolder,
}
