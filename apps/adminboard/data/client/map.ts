import { queryOptions } from '@tanstack/react-query';
import { getMaps } from '@/data/server/map';

export const mapKeys = { all: ['map'] } as const;

export const createMapQuery = () => {
  return queryOptions({ queryKey: mapKeys.all, queryFn: getMaps });
};
