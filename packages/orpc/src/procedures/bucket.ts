import { ORPCError } from '@orpc/server'
import { createAppLogger } from '@virtality/shared/observability'
import {
  deleteBucketObject,
  formatBucketListPage,
  moveBucketObject,
  normalizeBucketPrefix,
  uploadBucketObjects,
} from '@virtality/shared/utils'
import { Buffer } from 'node:buffer'
import { z } from 'zod'
import { authed } from '../middleware/auth.ts'

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

export const bucket = {
  list: listBucketPrefix,
  upload: uploadBucket,
  move: moveBucket,
  delete: deleteBucket,
}
