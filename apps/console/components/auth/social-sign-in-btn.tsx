'use client'
import { SiGoogle, SiGoogleHex } from '@icons-pack/react-simple-icons'
import { authClient } from '@/auth-client'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

interface SocialSignInButtonProps {
  referralCode?: string
}

const SocialSignInButton = ({ referralCode }: SocialSignInButtonProps) => {
  const [callbackURL, setCallbackURL] = useState('')

  useEffect(() => {
    const domain = window.location.origin

    if (domain) setCallbackURL(domain)
  }, [])

  const handleSignIn = () =>
    authClient.signIn.social({
      provider: 'google',

      callbackURL,
      ...(referralCode && {
        additionalData: { referralCode },
      }),
    })

  return (
    <Button
      variant='outline'
      size='lg'
      className='w-full'
      onClick={handleSignIn}
    >
      <SiGoogle color={SiGoogleHex} />
      <span>{'Sign-in with Google'}</span>
    </Button>
  )
}

export default SocialSignInButton
