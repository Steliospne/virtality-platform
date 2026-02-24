import UserTableDAL from '@/components/resources/user/user-table';
import Boundary from '@/components/shared/hydration-boundary';
import { getUsers } from '@/data/server/user';
import { getQueryClient } from '@/react-query';

const UserPage = async () => {
  const queryClient = getQueryClient();
  queryClient.prefetchQuery({ queryKey: ['users'], queryFn: getUsers });

  return (
    <Boundary client={queryClient}>
      <UserTableDAL />
    </Boundary>
  );
};

export default UserPage;
