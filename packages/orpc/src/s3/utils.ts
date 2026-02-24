import {
  DeleteObjectCommand,
  DeleteObjectCommandInput,
  PutObjectCommand,
  PutObjectCommandInput,
} from '@aws-sdk/client-s3'
import { s3 } from './init.ts'

const Bucket = process.env.AWS_S3_BUCKET

if (!Bucket) {
  throw new Error('AWS_S3_BUCKET is missing')
}

export const uploadFile = async ({
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
    return await s3.send(new PutObjectCommand(input))
  } catch (error) {
    console.log(error)
    return null
  }
}

export const deleteFile = async ({
  Key,
}: Pick<DeleteObjectCommandInput, 'Key'>) => {
  try {
    return await s3.send(new DeleteObjectCommand({ Key, Bucket }))
  } catch (error) {
    console.log(error)
    return null
  }
}
