'use client'

import { orpc } from '@/integrations/orpc/client'
import { useQuery, useMutation } from '@tanstack/react-query'

export const useSupplementalTherapyQuery = () => {
  return useQuery(orpc.supplementalTherapy.list.queryOptions())
}

type CreateSupplementalTherapyRelOnSuccess = ReturnType<
  typeof orpc.supplementalTherapy.createRel.mutationOptions
>['onSuccess']

interface useSupplementalTherapyRelMutationProps {
  onSuccess?: CreateSupplementalTherapyRelOnSuccess
}

export const useCreateSupplementalTherapyRelMutation = ({
  onSuccess,
}: useSupplementalTherapyRelMutationProps) => {
  return useMutation(
    orpc.supplementalTherapy.createRel.mutationOptions({ onSuccess }),
  )
}
