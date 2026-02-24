'use server';
import { prisma } from '@virtality/db';

export const getAvatars = async () => {
  try {
    const avatars = await prisma.avatar.findMany();
    return avatars;
  } catch (error) {
    console.log('Error getting avatars', error);
  }
};
