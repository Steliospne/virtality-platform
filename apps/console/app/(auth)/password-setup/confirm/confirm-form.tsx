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
        setErrorMessage('This approval link is invalid or has expired.')
      },
    })

  useEffect(() => {
    if (!token) return
    inspect({ token })
  }, [inspect, token])

  if (!token) {
    return (
      <Card className='w-full max-w-lg'>
        <CardHeader>
          <CardTitle className='text-2xl font-bold'>Invalid link</CardTitle>
          <CardDescription>
            This approval link is invalid or has expired.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild className='ml-auto'>
            <Link
              href={
                session?.user ? `/user/${session.user.id}/profile` : '/sign-in'
              }
            >
              {session?.user ? 'Back to profile' : 'Sign in'}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    )
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
      <Card className='w-full max-w-lg'>
        <CardHeader>
          <CardTitle className='text-2xl font-bold'>Invalid link</CardTitle>
          <CardDescription>
            This approval link is invalid or has expired.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild className='ml-auto'>
            <Link
              href={
                session?.user ? `/user/${session.user.id}/profile` : '/sign-in'
              }
            >
              {session?.user ? 'Back to profile' : 'Sign in'}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (isApproved) {
    return (
      <Card className='w-full max-w-lg'>
        <CardHeader>
          <CardTitle className='text-2xl font-bold'>Password set</CardTitle>
          <CardDescription>
            Your password has been approved. You can now sign in with email and
            password.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            className='ml-auto'
            onClick={() => {
              if (session?.user) {
                router.push(`/user/${session.user.id}/profile`)
                return
              }
              router.push('/sign-in')
            }}
          >
            {session?.user ? 'Back to profile' : 'Sign in'}
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className='w-full max-w-lg'>
      <CardHeader>
        <CardTitle className='text-2xl font-bold'>
          Approve password setup
        </CardTitle>
        <CardDescription>
          Confirm that you want to add password sign-in to your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {errorMessage ? (
          <p className='text-destructive text-sm'>{errorMessage}</p>
        ) : (
          <p className='text-muted-foreground text-sm'>
            Press approve to finish setting your password. Opening this page did
            not change your account.
          </p>
        )}
      </CardContent>
      <CardFooter className='flex gap-2'>
        <Button asChild variant='outline'>
          <Link
            href={
              session?.user ? `/user/${session.user.id}/profile` : '/sign-in'
            }
          >
            Cancel
          </Link>
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
