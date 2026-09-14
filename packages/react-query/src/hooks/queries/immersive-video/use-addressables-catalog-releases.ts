import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import type { AddressablesCatalogRelease } from '@virtality/orpc/client'
import { useORPC } from '../../../orpc-context.js'

export function useAddressablesCatalogReleases(): UseQueryResult<
  AddressablesCatalogRelease[]
> {
  const orpc = useORPC()
  return useQuery(orpc.immersiveVideo.addressablesCatalog.list.queryOptions())
}
