import BucketTableDAL from '@/components/bucket/bucket-table'
import HydrationBoundary from '@/components/shared/hydration-boundary'
import { createBucketQuery } from '@/data/client/bucket'
import { getQueryClient } from '@/react-query'

const Images = async () => {
  const queryClient = getQueryClient()

  queryClient.prefetchQuery(createBucketQuery())

  return (
    <HydrationBoundary client={queryClient}>
      <BucketTableDAL />
    </HydrationBoundary>
  )
}

export default Images
