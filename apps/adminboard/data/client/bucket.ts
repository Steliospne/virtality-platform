import { queryOptions } from '@tanstack/react-query';
import { getImages } from '@/data/server/file';

export const bucketKeys = { all: ['bucket'] } as const;

export const createBucketQuery = () => {
  return queryOptions({
    queryKey: bucketKeys.all,
    queryFn: getImages,
  });
};
