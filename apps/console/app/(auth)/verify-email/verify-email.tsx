'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Mail, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { authClient } from '@/auth-client'
import useIsUserVerified from '@/hooks/queries/user/use-is-user-verified.ts'

const COOKIE_NAME = 'verification_time'

const VerifyEmail = ({ remainingTime }: { remainingTime?: number }) => {
  const router = useRouter()
  const [countdown, setCountdown] = useState(remainingTime ?? 60)
  const [canResend, setCanResend] = useState(
    (!remainingTime && countdown <= 0) || remainingTime === 0,
  )
  const [isResending, setIsResending] = useState(false)

  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const { data: isVerified } = useIsUserVerified({ email })

  useEffect(() => {
    if (!remainingTime) setVerificationCookie()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (countdown % 5 === 0 && isVerified) {
      router.push('/')
    }

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [countdown, isVerified, router])

  const setVerificationCookie = () => {
    const now = Date.now()
    document.cookie = `${COOKIE_NAME}=${now}; path=/; max-age=60`
  }

  const handleResend = async () => {
    if (!email) return
    setIsResending(true)
    await authClient.sendVerificationEmail({
      email,
      callbackURL: process.env.NEXT_PUBLIC_DOMAIN_URL,
    })

    // Reset countdown + cookie
    setCountdown(60)
    setCanResend(false)
    setVerificationCookie()
    setIsResending(false)
  }

  return (
    <div className='flex min-h-screen items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='space-y-4 text-center'>
          <div className='bg-vital-blue-700/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full'>
            <Mail className='text-vital-blue-700 h-8 w-8' />
          </div>
          <div className='space-y-2'>
            <CardTitle className='text-2xl font-semibold text-balance'>
              Check your email
            </CardTitle>
            <CardDescription className='text-base text-pretty'>
              {"We've sent a verification link to"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='text-center'>
            <p className='text-foreground font-medium'>{email}</p>
          </div>

          <div className='space-y-4'>
            <div className='bg-muted/50 flex items-start gap-3 rounded-lg p-4'>
              <CheckCircle2 className='text-vital-blue-700 mt-0.5 size-5 shrink-0' />
              <p className='text-muted-foreground text-sm leading-relaxed'>
                {
                  "Click the link in the email to verify your account. If you don't see it, check your spam folder."
                }
              </p>
            </div>

            <div className='pt-2'>
              <Button
                onClick={handleResend}
                disabled={!canResend || isResending}
                variant='primary'
                className='w-full'
                size='lg'
              >
                {isResending
                  ? 'Sending...'
                  : canResend
                    ? 'Resend verification email'
                    : `Resend in ${countdown}s`}
              </Button>
            </div>

            <p className='text-muted-foreground text-center text-xs'>
              Wrong email address?{' '}
              <Button asChild variant='link'>
                <Link
                  href='/'
                  className='text-vital-blue-700 p-0! hover:underline'
                >
                  Go back
                </Link>
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default VerifyEmail
