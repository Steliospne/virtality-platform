import { createBucketQuery } from '@/data/client/bucket';
import { useQuery } from '@tanstack/react-query';

const useBucket = () => {
  return useQuery(createBucketQuery());
};

export default useBucket;
