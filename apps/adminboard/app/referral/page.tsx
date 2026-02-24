import Boundary from '@/components/shared/hydration-boundary';
import { getQueryClient } from '@/react-query';
import ReferralTableDAL from '@/components/referral/referral-table';
import { createReferralQuery } from '@/data/client/referral';

const ReferralPage = async () => {
  const queryClient = getQueryClient();
  queryClient.prefetchQuery(createReferralQuery());

  return (
    <Boundary client={queryClient}>
      <ReferralTableDAL />
    </Boundary>
  );
};

export default ReferralPage;
