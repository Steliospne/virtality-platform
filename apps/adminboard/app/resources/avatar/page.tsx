import { getQueryClient } from '@/react-query';
import Boundary from '@/components/shared/hydration-boundary';
import AvatarTableDAL from '@/components/resources/avatar/avatar-table';
import { createAvatarQuery } from '@/data/client/avatar';

const AvatarPage = async () => {
  const queryClient = getQueryClient();
  queryClient.prefetchQuery(createAvatarQuery());

  return (
    <Boundary client={queryClient}>
      <AvatarTableDAL />;
    </Boundary>
  );
};

export default AvatarPage;
