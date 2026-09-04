import { useMutation } from '@tanstack/react-query'
import type { ORPCUtils } from '../../../orpc.js'
import { useORPC } from '../../../orpc-context.js'

type CreateBugReportMutationOptions = ReturnType<
  ORPCUtils['bugReport']['create']['mutationOptions']
>
type CreateBugReportOnSuccess = NonNullable<
  CreateBugReportMutationOptions['onSuccess']
>

interface UseCreateBugReportProps {
  onSuccess?: CreateBugReportOnSuccess
}

export function useCreateBugReport({
  onSuccess,
}: UseCreateBugReportProps = {}) {
  const orpc = useORPC()
  return useMutation(orpc.bugReport.create.mutationOptions({ onSuccess }))
}
