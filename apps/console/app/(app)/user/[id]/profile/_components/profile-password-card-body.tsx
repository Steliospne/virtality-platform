'use client'
import { CardContent, CardFooter } from '@virtality/ui/components/card'
import { type ActivePendingPasswordChange } from '@virtality/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { PasswordField } from './profile-password-field'
import { SetPasswordField } from './profile-set-password-field'
import { PendingPasswordState } from './profile-pending-password-state'

export const PasswordCardBody = ({
  isLoading,
  hasPassword,
  activePendingPasswordChange,
}: {
  isLoading: boolean
  hasPassword: boolean | undefined
  activePendingPasswordChange: ActivePendingPasswordChange | null | undefined
}) => {
  if (isLoading) {
    return (
      <>
        <CardContent>
          <Skeleton className='h-10 w-full' />
        </CardContent>
        <CardFooter className='border-t'>
          <Skeleton className='ml-auto h-10 w-24' />
        </CardFooter>
      </>
    )
  }

  if (activePendingPasswordChange) {
    return <PendingPasswordState pending={activePendingPasswordChange} />
  }

  if (hasPassword) {
    return <PasswordField />
  }

  return <SetPasswordField />
}
