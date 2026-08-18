'use client'
import { Button } from '@virtality/ui/components/button'
import { toast } from 'react-toastify'
import { CardContent, CardFooter } from '@virtality/ui/components/card'
import {
  type ActivePendingPasswordChange,
  useCancelPendingPasswordChange,
  useORPC,
  useResendPendingPasswordChange,
} from '@virtality/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { invalidateActivePendingPasswordChange } from './profile-info-form'

const PENDING_PASSWORD_KIND_LABEL = {
  SETUP: 'Password setup',
  CHANGE: 'Password change',
} as const satisfies Record<ActivePendingPasswordChange['kind'], string>

const PENDING_PASSWORD_CANCEL_SUCCESS = {
  SETUP: 'Password setup request cancelled.',
  CHANGE: 'Password change request cancelled.',
} as const satisfies Record<ActivePendingPasswordChange['kind'], string>

export const PendingPasswordState = ({
  pending,
}: {
  pending: ActivePendingPasswordChange
}) => {
  const orpc = useORPC()
  const queryClient = useQueryClient()
  const { kind, destinationEmail, expiresAt } = pending
  const expiry = new Date(expiresAt)

  const { mutate: resend, isPending: isResending } =
    useResendPendingPasswordChange({
      onSuccess: async () => {
        await invalidateActivePendingPasswordChange(queryClient, orpc)
        toast.success('Approval email resent.')
      },
      onError: (error) => {
        console.error(error)
        toast.error('Failed to resend approval email')
      },
    })

  const { mutate: cancel, isPending: isCancelling } =
    useCancelPendingPasswordChange({
      onSuccess: async () => {
        await invalidateActivePendingPasswordChange(queryClient, orpc)
        toast.success(PENDING_PASSWORD_CANCEL_SUCCESS[kind])
      },
      onError: (error) => {
        console.error(error)
        toast.error('Failed to cancel pending password request')
      },
    })

  const isActionPending = isResending || isCancelling

  return (
    <>
      <CardContent className='space-y-2'>
        <p className='text-sm'>
          {PENDING_PASSWORD_KIND_LABEL[kind]} is pending approval. Check{' '}
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
