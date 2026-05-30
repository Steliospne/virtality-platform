'use client'
import { SiGoogle, SiGoogleHex } from '@icons-pack/react-simple-icons'
import { authClient } from '@/auth-client'
import { Button } from '@/components/ui/button'
import {
  CONSOLE_URL,
  CONSOLE_URL_LOCAL,
  CONSOLE_URL_STAGING,
} from '@virtality/shared/types'
import { useCallback, useState } from 'react'
import useTimeout from '@/hooks/use-timeout'
import { Spinner } from '@virtality/ui/components/spinner'
import { markPendingSocketWarmUp } from '@/hooks/use-warm-up-socket-on-sign-in'
import { warmUpSocketServer } from '@/lib/warm-up-socket-server'

interface SocialSignInButtonProps {
  referralCode?: string
}

const env = process.env.NEXT_PUBLIC_ENV || 'development'

const callbackURL =
  env === 'production'
    ? CONSOLE_URL
    : env === 'preview'
      ? CONSOLE_URL_STAGING
      : CONSOLE_URL_LOCAL

const SocialSignInButton = ({ referralCode }: SocialSignInButtonProps) => {
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTimeout = useCallback(() => {
    if (!isRunning) return
    setIsRunning(false)
  }, [isRunning])

  useTimeout(handleTimeout, isRunning ? 5000 : null)

  const handleSignIn = () => {
    setIsRunning(true)
    markPendingSocketWarmUp()
    authClient.signIn.social({
      provider: 'google',
      callbackURL,
      ...(referralCode && {
        additionalData: { referralCode },
      }),
      fetchOptions: {
        onSuccess: () => {
          void warmUpSocketServer()
          setIsRunning(false)
        },
        onError(context) {
          setError(context.error.message)
        },
      },
    })
  }

  return (
    <div>
      <Button
        variant='outline'
        size='lg'
        className='w-full'
        disabled={isRunning}
        onClick={handleSignIn}
      >
        {isRunning ? (
          <Spinner />
        ) : (
          <>
            <SiGoogle color={SiGoogleHex} />
            <span>{'Sign-in with Google'}</span>
          </>
        )}
      </Button>
      {error && <div className='text-red-500'>{error}</div>}
    </div>
  )
}

export default SocialSignInButton
