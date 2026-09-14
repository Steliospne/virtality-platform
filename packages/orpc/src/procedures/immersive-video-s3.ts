import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  ListPartsCommand,
  PutObjectCommand,
  UploadPartCommand,
} from '@aws-sdk/client-s3'
import type { VirtalityS3Client } from '../s3/index.ts'

export type ImmersiveVideoListedPart = {
  partNumber: number
  etag: string
  /** Base64 SHA-256 S3 computed for the part; required to complete a checksummed upload. */
  checksumSha256: string | null
}

export type ImmersiveVideoObjectHead = {
  contentLength: number
  /** Composite SHA-256 S3 recorded at Complete (`<base64>-<partCount>`); null when the object was not checksummed. */
  checksumSha256: string | null
}

export type ImmersiveVideoListedObject = {
  key: string
  size: number
  lastModified: string | null
}

export type ImmersiveVideoS3 = {
  createMultipartUpload: (input: {
    key: string
    contentType: string
  }) => Promise<{ uploadId: string }>
  uploadPart: (input: {
    key: string
    uploadId: string
    partNumber: number
    body: Buffer
    contentLength: number
  }) => Promise<void>
  listParts: (input: {
    key: string
    uploadId: string
  }) => Promise<ImmersiveVideoListedPart[]>
  completeMultipartUpload: (input: {
    key: string
    uploadId: string
    parts: ImmersiveVideoListedPart[]
  }) => Promise<void>
  abortMultipartUpload: (input: {
    key: string
    uploadId: string
  }) => Promise<void>
  putObject: (input: {
    key: string
    body: Buffer
    contentType: string
    cacheControl?: string
  }) => Promise<void>
  deleteObject: (input: { key: string }) => Promise<void>
  headObject: (input: { key: string }) => Promise<ImmersiveVideoObjectHead>
  /** Every object whose key starts with `prefix`, flat (no delimiter). */
  listObjects: (input: {
    prefix: string
  }) => Promise<ImmersiveVideoListedObject[]>
}

function requireBucket(): string {
  const bucket = process.env.AWS_S3_BUCKET
  if (!bucket) {
    throw new Error('AWS_S3_BUCKET is missing')
  }
  return bucket
}

export function createImmersiveVideoS3(
  client: VirtalityS3Client,
): ImmersiveVideoS3 {
  const Bucket = requireBucket()

  return {
    async createMultipartUpload({ key, contentType }) {
      const response = await client.send(
        new CreateMultipartUploadCommand({
          Bucket,
          Key: key,
          ContentType: contentType,
          ChecksumAlgorithm: 'SHA256',
        }),
      )
      if (!response.UploadId) {
        throw new Error('CreateMultipartUpload did not return an upload id')
      }
      return { uploadId: response.UploadId }
    },

    async uploadPart({ key, uploadId, partNumber, body, contentLength }) {
      await client.send(
        new UploadPartCommand({
          Bucket,
          Key: key,
          UploadId: uploadId,
          PartNumber: partNumber,
          Body: body,
          ContentLength: contentLength,
          ChecksumAlgorithm: 'SHA256',
        }),
      )
    },

    async listParts({ key, uploadId }) {
      const parts: ImmersiveVideoListedPart[] = []
      let partNumberMarker: string | undefined

      for (;;) {
        const response = await client.send(
          new ListPartsCommand({
            Bucket,
            Key: key,
            UploadId: uploadId,
            PartNumberMarker: partNumberMarker,
          }),
        )

        for (const part of response.Parts ?? []) {
          if (part.PartNumber == null || part.ETag == null) {
            continue
          }
          parts.push({
            partNumber: part.PartNumber,
            etag: part.ETag,
            checksumSha256: part.ChecksumSHA256 ?? null,
          })
        }

        if (!response.IsTruncated) {
          break
        }
        partNumberMarker = response.NextPartNumberMarker
      }

      return parts
    },

    async completeMultipartUpload({ key, uploadId, parts }) {
      await client.send(
        new CompleteMultipartUploadCommand({
          Bucket,
          Key: key,
          UploadId: uploadId,
          MultipartUpload: {
            Parts: parts
              .slice()
              .sort((a, b) => a.partNumber - b.partNumber)
              .map((part) => ({
                PartNumber: part.partNumber,
                ETag: part.etag,
                ...(part.checksumSha256
                  ? { ChecksumSHA256: part.checksumSha256 }
                  : {}),
              })),
          },
        }),
      )
    },

    async abortMultipartUpload({ key, uploadId }) {
      await client.send(
        new AbortMultipartUploadCommand({
          Bucket,
          Key: key,
          UploadId: uploadId,
        }),
      )
    },

    async putObject({ key, body, contentType, cacheControl }) {
      await client.send(
        new PutObjectCommand({
          Bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          ...(cacheControl ? { CacheControl: cacheControl } : {}),
        }),
      )
    },

    async deleteObject({ key }) {
      await client.send(
        new DeleteObjectCommand({
          Bucket,
          Key: key,
        }),
      )
    },

    async headObject({ key }) {
      const response = await client.send(
        new HeadObjectCommand({
          Bucket,
          Key: key,
          ChecksumMode: 'ENABLED',
        }),
      )
      return {
        contentLength: response.ContentLength ?? 0,
        checksumSha256: response.ChecksumSHA256 ?? null,
      }
    },

    async listObjects({ prefix }) {
      const objects: ImmersiveVideoListedObject[] = []
      let continuationToken: string | undefined

      for (;;) {
        const response = await client.send(
          new ListObjectsV2Command({
            Bucket,
            Prefix: prefix,
            ContinuationToken: continuationToken,
          }),
        )
        for (const object of response.Contents ?? []) {
          if (!object.Key) {
            continue
          }
          objects.push({
            key: object.Key,
            size: object.Size ?? 0,
            lastModified: object.LastModified?.toISOString() ?? null,
          })
        }
        if (!response.IsTruncated || !response.NextContinuationToken) {
          break
        }
        continuationToken = response.NextContinuationToken
      }

      return objects
    },
  }
}
