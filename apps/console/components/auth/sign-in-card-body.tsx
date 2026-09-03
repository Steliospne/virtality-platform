'use client'

import { Input } from '@virtality/ui/components/input'
import { Label } from '@virtality/ui/components/label'
import { Separator } from '@virtality/ui/components/separator'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import EmailSignIn from '@/components/auth/email-sign-in'
import SocialSignInButton from '@/components/auth/social-sign-in-btn'
import { authClient } from '@/auth-client'
import {
  readAccessCodeFromSearchParams,
  signUpHref,
} from '@/lib/auth-access-code-url'
import { resolvePostLoginPath } from '@/lib/sign-in-redirect'

const TESTER_CODE_STORAGE_KEY = 'virtality_tester_code'

export const getTesterCodeFromUrl = () => {
  if (typeof window === 'undefined') return null
  const code = readAccessCodeFromSearchParams(
    new URLSearchParams(window.location.search),
  )
  return code || null
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
  const searchParams = useSearchParams()
  const redirectParam = searchParams.get('redirect')
  const postLoginPath = resolvePostLoginPath(redirectParam)
  const urlAccessCode = readAccessCodeFromSearchParams(searchParams)
  const { data } = authClient.useSession()
  const [testerCode, setTesterCode] = useState(urlAccessCode)

  useEffect(() => {
    if (data?.user) {
      router.push(postLoginPath)
    }
  }, [data?.user, postLoginPath, router])

  return (
    <>
      <div className='space-y-4'>
        <div className='space-y-2'>
          <Label
            htmlFor='tester-code'
            className='text-muted-foreground text-xs'
          >
            Redeem code
          </Label>
          <Input
            id='tester-code'
            type='text'
            value={testerCode}
            onChange={(e) => setTesterCode(e.target.value)}
            className='text-sm'
          />
        </div>
        <SocialSignInButton
          testerCode={testerCode?.trim() || undefined}
          postLoginPath={postLoginPath}
        />
      </div>
      <Separator className='my-2' />
      <EmailSignIn
        postLoginPath={postLoginPath}
        testerCode={testerCode?.trim() || undefined}
      />
      <div className='flex w-full flex-col gap-2'>
        <p className='text-muted-foreground mt-6 text-sm'>
          {"Don't have an account? "}
          <Link
            href={signUpHref(testerCode)}
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
