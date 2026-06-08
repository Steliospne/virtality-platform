import {
  formatBucketListPage,
  normalizeBucketPrefix,
} from '@virtality/shared/utils'
import { z } from 'zod'
import { authed } from '../middleware/auth.ts'

const BucketListInput = z.object({
  prefix: z.string().optional().default(''),
  continuationToken: z.string().optional(),
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

export const bucket = {
  list: listBucketPrefix,
}
