import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
  DeleteObjectCommand,
  DeleteObjectCommandInput,
} from '@aws-sdk/client-s3'

const AwsAccessKeyId = process.env.AWS_ACCESS_KEY_ID
const AwsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
const AwsRegion = process.env.AWS_REGION
const AwsS3Bucket = process.env.AWS_S3_BUCKET

const s3 = new S3Client({
  credentials: {
    accessKeyId: AwsAccessKeyId!,
    secretAccessKey: AwsSecretAccessKey!,
  },
  region: AwsRegion!,
})

export const uploadFile = async ({
  ContentType,
  Body,
  Key,
}: Pick<PutObjectCommandInput, 'ContentType' | 'Body' | 'Key'>) => {
  if (Body === undefined || Key === undefined || AwsS3Bucket === undefined) {
    throw new Error('Body, Key and AWS_S3_BUCKET are required')
  }
  try {
    const input: PutObjectCommandInput = {
      Bucket: AwsS3Bucket,
      Key,
      Body,
      ...(ContentType !== undefined && { ContentType }),
    }
    await s3.send(new PutObjectCommand(input))
  } catch (error) {
    console.log(error)
  }
}

export const deleteFile = async ({
  Key,
}: Pick<DeleteObjectCommandInput, 'Key'>) => {
  if (Key === undefined || AwsS3Bucket === undefined) {
    throw new Error('Key and AWS_S3_BUCKET are required')
  }
  try {
    await s3.send(new DeleteObjectCommand({ Key, Bucket: AwsS3Bucket }))
  } catch (error) {
    console.log(error)
  }
}

export default s3
