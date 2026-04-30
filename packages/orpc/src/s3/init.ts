import {
  S3Client,
  DeleteObjectCommand,
  DeleteObjectCommandInput,
  ListObjectsV2Command,
  PutObjectCommand,
  PutObjectCommandInput,
} from '@aws-sdk/client-s3'

const accessKeyId = process.env.AWS_ACCESS_KEY_ID
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
const region = process.env.AWS_REGION

if (!accessKeyId || !secretAccessKey || !region) {
  throw new Error('AWS credentials are missing')
}

const Bucket = process.env.AWS_S3_BUCKET

if (!Bucket) {
  throw new Error('AWS_S3_BUCKET is missing')
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

  listFiles = async (): Promise<string[]> => {
    try {
      const response = await this.send(new ListObjectsV2Command({ Bucket }))
      return (
        (response.Contents?.map((item) => item.Key).filter(
          Boolean,
        ) as string[]) ?? []
      )
    } catch (error) {
      console.error('Error listing S3 bucket objects:', error)
      return []
    }
  }

  uploadFile = async ({
    ContentType,
    Body,
    Key,
  }: Pick<PutObjectCommandInput, 'ContentType' | 'Body' | 'Key'>) => {
    try {
      const input: PutObjectCommandInput = {
        Bucket,
        Key,
        Body,
        ...(ContentType !== undefined && { ContentType }),
      }
      return await this.send(new PutObjectCommand(input))
    } catch (error) {
      console.log(error)
      return null
    }
  }

  deleteFile = async ({ Key }: Pick<DeleteObjectCommandInput, 'Key'>) => {
    try {
      return await this.send(new DeleteObjectCommand({ Key, Bucket }))
    } catch (error) {
      console.log(error)
      return null
    }
  }
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
