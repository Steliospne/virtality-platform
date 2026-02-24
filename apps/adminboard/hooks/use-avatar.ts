'use client';

import { createAvatarQuery } from '@/data/client/avatar';
import { useQuery } from '@tanstack/react-query';

const useAvatarList = () => {
  return useQuery(createAvatarQuery());
};

export default useAvatarList;
