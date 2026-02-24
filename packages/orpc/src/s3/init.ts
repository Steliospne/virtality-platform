import { S3Client } from '@aws-sdk/client-s3'
import { deleteFile, uploadFile } from './utils.ts'

const accessKeyId = process.env.AWS_ACCESS_KEY_ID
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
const region = process.env.AWS_REGION

if (!accessKeyId || !secretAccessKey || !region) {
  throw new Error('AWS credentials are missing')
}

class VirtalityS3 extends S3Client {
  constructor({
    credentials,
    region,
  }: {
    credentials: { accessKeyId: string; secretAccessKey: string }
    region: string
  }) {
    super({
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      },
      region,
    })
  }

  uploadFile = uploadFile.bind(this)

  deleteFile = deleteFile.bind(this)
}

export const s3 = new S3Client({
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  region,
})

export const virtalityS3 = new VirtalityS3({
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  region,
})

export type VirtalityS3Client = typeof virtalityS3
