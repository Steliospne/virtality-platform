import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
  DeleteObjectCommand,
  DeleteObjectCommandInput,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';

const AwsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
const AwsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const AwsRegion = process.env.AWS_REGION;
const AwsS3Bucket = process.env.AWS_S3_BUCKET;

const s3 = new S3Client({
  credentials: {
    accessKeyId: AwsAccessKeyId!,
    secretAccessKey: AwsSecretAccessKey!,
  },
  region: AwsRegion!,
});

export const uploadFile = async ({
  ContentType,
  Body,
  Key,
}: Partial<PutObjectCommandInput>) => {
  try {
    await s3.send(
      new PutObjectCommand({ ContentType, Body, Key, Bucket: AwsS3Bucket }),
    );
  } catch (error) {
    console.log(error);
  }
};

export const deleteFile = async ({
  Key,
}: Partial<DeleteObjectCommandInput>) => {
  try {
    await s3.send(new DeleteObjectCommand({ Key, Bucket: AwsS3Bucket }));
  } catch (error) {
    console.log(error);
  }
};

export const getFiles = async () => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: AwsS3Bucket,
    });

    const response = await s3.send(command);

    // `response.Contents` will contain metadata of each object (e.g., Key, Size, etc.)
    const files = response.Contents?.map((item) => item.Key) || [];
    return files;
  } catch (error) {
    console.error('Error listing S3 bucket objects:', error);
    return [];
  }
};

export default s3;
