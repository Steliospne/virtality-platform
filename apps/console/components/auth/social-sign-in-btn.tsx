'use client'
import { SiGoogle, SiGoogleHex } from '@icons-pack/react-simple-icons'
import { authClient } from '@/auth-client'
import { Button } from '@virtality/ui/components/button'
import { getWebsiteUrl } from '@virtality/shared/types'
import { isTrialRedeemWaitlistRedirect } from '@virtality/shared/utils'
import { useCallback, useState } from 'react'
import useTimeout from '@/hooks/use-timeout'
import { Spinner } from '@virtality/ui/components/spinner'
import { markPendingSocketWarmUp } from '@/hooks/use-warm-up-socket-on-sign-in'
import { warmUpSocketServer } from '@/lib/warm-up-socket-server'
import {
  DEFAULT_POST_LOGIN_PATH,
  toSocialSignInCallbackUrl,
} from '@/lib/sign-in-redirect'

interface SocialSignInButtonProps {
  testerCode?: string
  postLoginPath?: string
}

const websiteURL = getWebsiteUrl()

const SocialSignInButton = ({
  testerCode,
  postLoginPath = DEFAULT_POST_LOGIN_PATH,
}: SocialSignInButtonProps) => {
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
      callbackURL: toSocialSignInCallbackUrl(postLoginPath),
      ...(testerCode && {
        additionalData: { testerCode },
      }),
      fetchOptions: {
        onSuccess: () => {
          void warmUpSocketServer()
          setIsRunning(false)
        },
        onError(context) {
          if (isTrialRedeemWaitlistRedirect(context.error.message)) {
            window.location.assign(`${websiteURL}/waitlist`)
            return
          }
          setError(context.error.message)
          setIsRunning(false)
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
