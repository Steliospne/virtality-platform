import { getQueryClient } from '@/react-query';
import Boundary from '@/components/shared/hydration-boundary';
import MapTableDAL from '@/components/resources/map/map-table';
import { createMapQuery } from '@/data/client/map';

const MapsPage = async () => {
  const queryClient = getQueryClient();
  queryClient.prefetchQuery(createMapQuery());

  return (
    <Boundary client={queryClient}>
      <MapTableDAL />;
    </Boundary>
  );
};

export default MapsPage;
