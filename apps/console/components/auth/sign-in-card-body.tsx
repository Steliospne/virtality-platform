'use client'

import { Input } from '@virtality/ui/components/input'
import { Label } from '@virtality/ui/components/label'
import { Separator } from '@virtality/ui/components/separator'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import EmailSignIn from '@/components/auth/email-sign-in'
import SocialSignInButton from '@/components/auth/social-sign-in-btn'
import { authClient } from '@/auth-client'
import { useRouter } from 'next/navigation'

const TESTER_CODE_STORAGE_KEY = 'virtality_tester_code'

export const getTesterCodeFromUrl = () => {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  return params.get('testerCode')
}

export const storeTesterCodeForSignUp = (code: string) => {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(TESTER_CODE_STORAGE_KEY, code)
}

export const getStoredTesterCode = () => {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(TESTER_CODE_STORAGE_KEY)
}

export const clearStoredTesterCode = () => {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(TESTER_CODE_STORAGE_KEY)
}

const SignInCardBody = () => {
  const router = useRouter()
  const { data } = authClient.useSession()
  const [testerCode, setTesterCode] = useState('')

  const signUpHref = testerCode.trim()
    ? `/sign-up?testerCode=${encodeURIComponent(testerCode.trim())}`
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
            htmlFor='tester-code'
            className='text-muted-foreground text-xs'
          >
            Tester code (optional)
          </Label>
          <Input
            id='tester-code'
            type='text'
            placeholder='Enter code to sign up as tester'
            value={testerCode}
            onChange={(e) => setTesterCode(e.target.value)}
            className='text-sm'
          />
        </div>
        <SocialSignInButton testerCode={testerCode?.trim() || undefined} />
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
