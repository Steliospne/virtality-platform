'use client';

import { fetchUsers } from '@/data/client/user';
import { useQuery } from '@tanstack/react-query';

const useUserList = () => {
  const { data, isPending } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetchUsers({}),
  });
  return { data, isPending };
};
export default useUserList;
