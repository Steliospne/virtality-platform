'use server';
import { deleteFile, uploadFile } from '@/S3';
import { FormError, IMAGE_TYPE, ImageType } from '@/types/models';
import { randomImageName } from '@/lib/utils';
import { prisma } from '@virtality/db';
import { getUserAndSession } from './authActions';

export const uploadFileAction = async (
  state: {
    validationErrors: FormError<File> | null;
    values: Partial<File> | string | null;
  },
  formData?: FormData,
) => {
  const session = await getUserAndSession();
  if (!session || !formData) return { validationErrors: null, values: null };

  const entries = Object.fromEntries(formData);

  const { typeName, itemId, image } = entries as {
    typeName: string;
    itemId: string;
    image: File;
  };
  const imageUrl = image.size !== 0 ? randomImageName() + '_' + typeName : null;
  //maybe also delete the previous image when updating a new one

  if (imageUrl) {
    let prevImageKey;
    switch (typeName) {
      case 'Exercise':
        prevImageKey = await prisma.exercise
          .findUnique({
            where: { id: itemId },
          })
          .then((res) => res?.image);
        await deleteFile({
          Key: prevImageKey!,
          Bucket: '',
        });
        await prisma.exercise.update({
          where: {
            id: itemId,
          },
          data: { image: imageUrl },
        });
        break;
      case 'User':
        prevImageKey = await prisma.user
          .findUnique({
            where: { id: itemId },
          })
          .then((res) => res?.image);
        await deleteFile({
          Key: prevImageKey!,
          Bucket: '',
        });
        await prisma.user.update({
          where: {
            id: itemId,
          },
          data: { image: imageUrl },
        });
        break;
      case 'Map':
        prevImageKey = await prisma.map
          .findUnique({
            where: { id: itemId },
          })
          .then((res) => res?.image);
        await deleteFile({
          Key: prevImageKey!,
          Bucket: '',
        });
        await prisma.map.update({
          where: {
            id: itemId,
          },
          data: { image: imageUrl },
        });
        break;
      case 'Avatar':
        prevImageKey = await prisma.avatar
          .findUnique({
            where: { id: itemId },
          })
          .then((res) => res?.image);
        await deleteFile({
          Key: prevImageKey!,
          Bucket: '',
        });
        await prisma.avatar.update({
          where: {
            id: itemId,
          },
          data: { image: imageUrl },
        });
        break;
      case 'Patient':
        prevImageKey = await prisma.patient
          .findUnique({
            where: { id: itemId },
          })
          .then((res) => res?.image);
        await deleteFile({
          Key: prevImageKey!,
          Bucket: '',
        });
        await prisma.patient.update({
          where: {
            id: itemId,
          },
          data: { image: imageUrl },
        });
        break;
    }
    const imageFile = image;
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    await uploadFile({
      Body: buffer,
      ContentType: imageFile.type,
      Key: imageUrl,
      Bucket: '',
    });
  }
  return { validationErrors: null, values: imageUrl };
};

export const createImage = async (
  image: File,
  prevImage?: string | null,
  opt?: {
    resource?: string;
    defaultName?: boolean;
  },
) => {
  const baseURL = process.env.CDN_URL;

  if (!baseURL) throw Error('CDN URL is missing.');

  if (!image) return null;

  const ContentType = image.type as ImageType;
  const Key = opt?.defaultName
    ? image.name
    : `${randomImageName()}${opt?.resource ? `_${opt.resource}` : ''}${IMAGE_TYPE[ContentType]}`;
  const generatedURL = `${baseURL}/${Key}`;
  const buffer = Buffer.from(await image.arrayBuffer());

  try {
    await uploadFile({
      Body: buffer,
      ContentType,
      Key,
    });
    if (prevImage) {
      const Key = prevImage.split('/')[3];
      deleteFile({ Key });
    }
    return generatedURL;
  } catch (error) {
    console.log('Error uploading to S3: ', error);
    return null;
  }
};

export const deleteFileAction = async (imageUrl: string) => {
  await deleteFile({
    Key: imageUrl!,
  });
  const typeName = imageUrl.split('_')[1];
  switch (typeName) {
    case 'Exercise':
      const exercise = await prisma.exercise.findFirst({
        where: { image: imageUrl },
      });
      if (exercise) {
        await prisma.exercise.update({
          where: { id: exercise.id },
          data: { image: null },
        });
      }
      break;
    case 'User':
      const user = await prisma.user.findFirst({
        where: { image: imageUrl },
      });
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { image: null },
        });
      }
      break;
    case 'Map':
      const map = await prisma.map.findFirst({
        where: { image: imageUrl },
      });
      if (map) {
        await prisma.map.update({
          where: { id: map.id },
          data: { image: null },
        });
      }
      break;
    case 'Avatar':
      const avatar = await prisma.avatar.findFirst({
        where: { image: imageUrl },
      });
      if (avatar) {
        await prisma.avatar.update({
          where: { id: avatar.id },
          data: { image: null },
        });
      }
      break;
  }
};
