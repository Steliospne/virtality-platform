'use client'
import { Button } from '@virtality/ui/components/button'
import { toast } from 'react-toastify'
import { CardContent, CardFooter } from '@virtality/ui/components/card'
import {
  type ActivePendingAccountDeletion,
  useCancelPendingAccountDeletion,
  useORPC,
  useResendPendingAccountDeletion,
} from '@virtality/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { invalidateActivePendingAccountDeletion } from './profile-info-form'

export const PendingAccountDeletionState = ({
  pending,
}: {
  pending: ActivePendingAccountDeletion
}) => {
  const orpc = useORPC()
  const queryClient = useQueryClient()
  const { destinationEmail, expiresAt } = pending
  const expiry = new Date(expiresAt)

  const { mutate: resend, isPending: isResending } =
    useResendPendingAccountDeletion({
      onSuccess: async () => {
        await invalidateActivePendingAccountDeletion(queryClient, orpc)
        toast.success('Approval email resent.')
      },
      onError: (error) => {
        console.error(error)
        toast.error('Failed to resend approval email')
      },
    })

  const { mutate: cancel, isPending: isCancelling } =
    useCancelPendingAccountDeletion({
      onSuccess: async () => {
        await invalidateActivePendingAccountDeletion(queryClient, orpc)
        toast.success('Account deletion request cancelled.')
      },
      onError: (error) => {
        console.error(error)
        toast.error('Failed to cancel pending deletion request')
      },
    })

  const isActionPending = isResending || isCancelling

  return (
    <>
      <CardContent className='space-y-2'>
        <p className='text-sm'>
          Account deletion is pending approval. Check{' '}
          <span className='font-medium'>{destinationEmail}</span> for the
          approval email.
        </p>
        <p className='text-muted-foreground text-sm'>
          The approval link expires at {expiry.toLocaleString()}.
        </p>
      </CardContent>
      <CardFooter className='flex gap-2 border-t'>
        <Button
          type='button'
          variant='outline'
          disabled={isActionPending}
          onClick={() => cancel(undefined)}
        >
          {isCancelling ? 'Cancelling...' : 'Cancel request'}
        </Button>
        <Button
          type='button'
          variant='destructive'
          className='ml-auto'
          disabled={isActionPending}
          onClick={() => resend(undefined)}
        >
          {isResending ? 'Resending...' : 'Resend email'}
        </Button>
      </CardFooter>
    </>
  )
}
