'use server';
import { getFiles } from '@/S3';

const baseURL = process.env.CDN_URL;

export const getImages = async () => {
  const images = await getFiles();
  const exclude = ['mp4', 'mov'];

  const filterHandler = (i?: string) => {
    if (!i) return;
    const type = i.split('.')[1];
    if (!type) return;
    if (!exclude.includes(type)) return i;
  };

  const imageDataMapping = (item?: string) => {
    return {
      imageURL: `${baseURL}/${item}`,
      key: item,
    };
  };

  return images.filter(filterHandler).map(imageDataMapping);
};
