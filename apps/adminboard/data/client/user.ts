import { authClient } from '@/auth-client';

type Query = {
  searchValue?: string | undefined;
  searchField?: 'name' | 'email' | undefined;
  searchOperator?: 'contains' | 'starts_with' | 'ends_with' | undefined;
  limit?: string | number | undefined;
  offset?: string | number | undefined;
  sortBy?: string | undefined;
  sortDirection?: 'asc' | 'desc' | undefined;
  filterField?: string | undefined;
  filterValue?: string | number | boolean | undefined;
  filterOperator?: 'eq' | 'ne' | 'lt' | 'lte' | 'gt' | 'gte' | undefined;
};

export const fetchUsers = async (query?: Query) => {
  return await authClient.admin.listUsers({
    query: { ...query },
  });
};
