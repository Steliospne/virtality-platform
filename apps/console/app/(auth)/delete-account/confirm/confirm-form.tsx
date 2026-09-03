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
  useApprovePendingAccountDeletion,
  useInspectPendingAccountDeletion,
} from '@virtality/react-query'
import { INVALID_APPROVAL_LINK_MESSAGE } from '@virtality/shared/utils'

type Session = ReturnType<typeof authClient.useSession>['data']

const getReturnNavigation = (
  session: Session,
  canReturnToProfile: boolean,
): { href: string; label: string } => {
  if (canReturnToProfile && session?.user) {
    return {
      href: `/user/${session.user.id}/profile`,
      label: 'Back to profile',
    }
  }

  return { href: '/sign-in', label: 'Sign in' }
}

const InvalidLinkCard = ({
  session,
  canReturnToProfile,
}: {
  session: Session
  canReturnToProfile: boolean
}) => {
  const returnNavigation = getReturnNavigation(session, canReturnToProfile)

  return (
    <Card className='w-full max-w-lg'>
      <CardHeader>
        <CardTitle className='text-2xl font-bold'>Invalid link</CardTitle>
        <CardDescription>{INVALID_APPROVAL_LINK_MESSAGE}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button asChild className='ml-auto'>
          <Link href={returnNavigation.href}>{returnNavigation.label}</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

const DeleteAccountConfirmForm = ({ token }: { token?: string }) => {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {
    mutate: inspect,
    data: inspectResult,
    isPending: isInspecting,
  } = useInspectPendingAccountDeletion()

  const { mutate: approve, isPending: isApproving } =
    useApprovePendingAccountDeletion({
      onSuccess: async () => {
        setErrorMessage(null)
        await authClient.signOut()
        router.push('/goodbye')
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
    return <InvalidLinkCard session={session} canReturnToProfile={false} />
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
    return (
      <InvalidLinkCard
        session={session}
        canReturnToProfile={inspectResult.canReturnToProfile}
      />
    )
  }

  return (
    <Card className='w-full max-w-lg'>
      <CardHeader>
        <CardTitle className='text-2xl font-bold'>
          Approve account deletion
        </CardTitle>
        <CardDescription>
          Confirm that you want to permanently delete your account. This action
          cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {errorMessage ? (
          <p className='text-destructive text-sm'>{errorMessage}</p>
        ) : (
          <p className='text-muted-foreground text-sm'>
            Press approve to permanently delete your account. Opening this page
            did not delete your account.
          </p>
        )}
      </CardContent>
      <CardFooter className='flex gap-2'>
        <Button asChild variant='outline'>
          <Link href={getReturnNavigation(session, true).href}>Cancel</Link>
        </Button>
        <Button
          className='ml-auto'
          variant='destructive'
          disabled={isApproving}
          onClick={() => approve({ token })}
        >
          {isApproving ? 'Deleting...' : 'Delete account'}
        </Button>
      </CardFooter>
    </Card>
  )
}

export default DeleteAccountConfirmForm
