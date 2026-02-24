import { queryOptions } from '@tanstack/react-query';
import { getAvatars } from '@/data/server/avatar';

export const avatarKeys = {
  all: ['avatar'],
} as const;

export const createAvatarQuery = () => {
  return queryOptions({ queryKey: avatarKeys.all, queryFn: getAvatars });
};
