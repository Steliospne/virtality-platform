import { ORPCError } from '@orpc/server'
import { createAppLogger } from '@virtality/shared/observability'
import {
  formatBucketListPage,
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

export const bucket = {
  list: listBucketPrefix,
  upload: uploadBucket,
}
