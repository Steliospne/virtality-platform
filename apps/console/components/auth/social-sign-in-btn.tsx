'use client'
import { SiGoogle, SiGoogleHex } from '@icons-pack/react-simple-icons'
import { authClient } from '@/auth-client'
import { Button } from '@virtality/ui/components/button'
import { getConsoleUrl } from '@virtality/shared/types'
import { useCallback, useState } from 'react'
import useTimeout from '@/hooks/use-timeout'
import { Spinner } from '@virtality/ui/components/spinner'
import { markPendingSocketWarmUp } from '@/hooks/use-warm-up-socket-on-sign-in'
import { warmUpSocketServer } from '@/lib/warm-up-socket-server'

interface SocialSignInButtonProps {
  referralCode?: string
}

const callbackURL = getConsoleUrl()

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
