'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@virtality/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@virtality/ui/components/card'
import { authClient } from '@/auth-client'
import {
  useApprovePendingPasswordChange,
  useInspectPendingPasswordChange,
  useORPC,
} from '@virtality/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { INVALID_APPROVAL_LINK_MESSAGE } from '@virtality/shared/utils'

type Session = ReturnType<typeof authClient.useSession>['data']

const getReturnPath = (session: Session) =>
  session?.user ? `/user/${session.user.id}/profile` : '/sign-in'

const getReturnLabel = (session: Session) =>
  session?.user ? 'Back to profile' : 'Sign in'

const navigateAfterApproval = (
  router: ReturnType<typeof useRouter>,
  session: Session,
) => {
  router.push(getReturnPath(session))
}

const InvalidLinkCard = ({ session }: { session: Session }) => (
  <Card className='w-full max-w-lg'>
    <CardHeader>
      <CardTitle className='text-2xl font-bold'>Invalid link</CardTitle>
      <CardDescription>{INVALID_APPROVAL_LINK_MESSAGE}</CardDescription>
    </CardHeader>
    <CardFooter>
      <Button asChild className='ml-auto'>
        <Link href={getReturnPath(session)}>{getReturnLabel(session)}</Link>
      </Button>
    </CardFooter>
  </Card>
)

const PasswordSetupConfirmForm = ({ token }: { token?: string }) => {
  const router = useRouter()
  const orpc = useORPC()
  const queryClient = useQueryClient()
  const { data: session } = authClient.useSession()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isApproved, setIsApproved] = useState(false)

  const {
    mutate: inspect,
    data: inspectResult,
    isPending: isInspecting,
  } = useInspectPendingPasswordChange()

  const { mutate: approve, isPending: isApproving } =
    useApprovePendingPasswordChange({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: orpc.user.hasPassword.key(),
        })
        await queryClient.invalidateQueries({
          queryKey: orpc.pendingPasswordChange.getActive.key(),
        })
        setIsApproved(true)
        setErrorMessage(null)
      },
      onError: () => {
        setErrorMessage(INVALID_APPROVAL_LINK_MESSAGE)
      },
    })

  useEffect(() => {
    if (!token) return
    inspect({ token })
  }, [inspect, token])

  if (!token) {
    return <InvalidLinkCard session={session} />
  }

  if (isInspecting || inspectResult === undefined) {
    return (
      <Card className='w-full max-w-lg'>
        <CardHeader>
          <CardTitle className='text-2xl font-bold'>
            Checking approval link
          </CardTitle>
          <CardDescription>
            Please wait while we verify your link.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!inspectResult.valid) {
    return <InvalidLinkCard session={session} />
  }

  const isChange = inspectResult.kind === 'CHANGE'

  if (isApproved) {
    return (
      <Card className='w-full max-w-lg'>
        <CardHeader>
          <CardTitle className='text-2xl font-bold'>
            {isChange ? 'Password changed' : 'Password set'}
          </CardTitle>
          <CardDescription>
            {isChange
              ? 'Your new password has been approved and is now active.'
              : 'Your password has been approved. You can now sign in with email and password.'}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            className='ml-auto'
            onClick={() => navigateAfterApproval(router, session)}
          >
            {getReturnLabel(session)}
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className='w-full max-w-lg'>
      <CardHeader>
        <CardTitle className='text-2xl font-bold'>
          {isChange ? 'Approve password change' : 'Approve password setup'}
        </CardTitle>
        <CardDescription>
          {isChange
            ? 'Confirm that you want to change your account password.'
            : 'Confirm that you want to add password sign-in to your account.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {errorMessage ? (
          <p className='text-destructive text-sm'>{errorMessage}</p>
        ) : (
          <p className='text-muted-foreground text-sm'>
            Press approve to finish{' '}
            {isChange ? 'changing your password' : 'setting your password'}.
            Opening this page did not change your account.
          </p>
        )}
      </CardContent>
      <CardFooter className='flex gap-2'>
        <Button asChild variant='outline'>
          <Link href={getReturnPath(session)}>Cancel</Link>
        </Button>
        <Button
          className='ml-auto'
          disabled={isApproving}
          onClick={() => approve({ token })}
        >
          {isApproving ? 'Approving...' : 'Approve'}
        </Button>
      </CardFooter>
    </Card>
  )
}

export default PasswordSetupConfirmForm
