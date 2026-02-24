'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import EmailSignIn from '@/components/auth/email-sign-in'
import SocialSignInButton from '@/components/auth/social-sign-in-btn'
import { authClient } from '@/auth-client'
import { useRouter } from 'next/navigation'

const REFERRAL_CODE_STORAGE_KEY = 'virtality_referral_code'

export const getReferralCodeFromUrl = () => {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  return params.get('referralCode')
}

export const storeReferralCodeForSignUp = (code: string) => {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(REFERRAL_CODE_STORAGE_KEY, code)
}

export const getStoredReferralCode = () => {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(REFERRAL_CODE_STORAGE_KEY)
}

export const clearStoredReferralCode = () => {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(REFERRAL_CODE_STORAGE_KEY)
}

const SignInCardBody = () => {
  const router = useRouter()
  const { data } = authClient.useSession()
  const [referralCode, setReferralCode] = useState('')

  const signUpHref = referralCode.trim()
    ? `/sign-up?referralCode=${encodeURIComponent(referralCode.trim())}`
    : '/sign-up'

  useEffect(() => {
    if (data?.user) {
      router.push('/')
    }
  }, [data?.user, router])

  return (
    <>
      <div className='space-y-4'>
        <div className='space-y-2'>
          <Label
            htmlFor='referral-code'
            className='text-muted-foreground text-xs'
          >
            Referral code (optional)
          </Label>
          <Input
            id='referral-code'
            type='text'
            placeholder='Enter code to sign up as referral'
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
            className='text-sm'
          />
        </div>
        <SocialSignInButton referralCode={referralCode?.trim() || undefined} />
      </div>
      <Separator className='my-2' />
      <EmailSignIn />
      <div className='flex w-full flex-col gap-2'>
        <p className='text-muted-foreground mt-6 text-sm'>
          {"Don't have an account? "}
          <Link
            href={signUpHref}
            className='text-blue-600 hover:underline'
            aria-disabled
          >
            Sign up here
          </Link>
        </p>
        <p className='text-muted-foreground text-sm'>
          Forgot your password?{' '}
          <Link
            href='/forgot-password'
            className='text-blue-600 hover:underline'
          >
            Reset it
          </Link>
        </p>
      </div>
    </>
  )
}

export default SignInCardBody
