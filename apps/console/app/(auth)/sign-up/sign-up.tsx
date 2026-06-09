'use client'
import { Button } from '@virtality/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@virtality/ui/components/card'
import { Separator } from '@virtality/ui/components/separator'
import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { SignUpSchema, SignUpForm } from '@/lib/definitions'
import { authClient } from '@/auth-client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useClientT } from '@/i18n/use-client-t'
import { Loader2 } from 'lucide-react'
import SignupForm from '@/components/auth/sign-up-form'
import { Label } from '@virtality/ui/components/label'
import { Input } from '@virtality/ui/components/input'
import { getConsoleUrl } from '@virtality/shared/types'

const baseURL = getConsoleUrl()

const SignUp = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const _referralCode = searchParams.get('referralCode')
  const [referralCode, setReferralCode] = useState(_referralCode || '')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { i18n } = useClientT()

  const form = useForm<SignUpForm>({
    resolver: zodResolver(SignUpSchema),
    mode: 'onChange',
    criteriaMode: 'all',
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  })

  async function onSubmit(values: SignUpForm) {
    if (submitError) setSubmitError(null)
    const { error } = await authClient.signUp.email({
      ...values,
      ...(referralCode?.trim() && { referralCode: referralCode.trim() }),
      callbackURL: baseURL,
      fetchOptions: {
        onSuccess: () => router.push(`/verify-email?email=${values.email}`),
      },
    })
    if (error?.message) setSubmitError(error.message)
  }

  return (
    <section className='h-screen-with-header flex flex-col items-center justify-center'>
      <Card className='w-full max-w-lg'>
        <CardHeader>
          <CardTitle className='text-2xl font-bold'>
            Sign up with Virtality
          </CardTitle>
          <CardDescription className='text-muted-foreground space-y-2 text-sm'>
            <p>{'Please enter your credentials to create your new account.'}</p>
            <p className='text-xs'>{'Fields with * are required.'}</p>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Separator className='my-2' />
          <div className='mb-4 space-y-2'>
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
              value={referralCode || ''}
              onChange={(e) => setReferralCode(e.target.value)}
              className='text-sm'
            />
          </div>
          <SignupForm id='sign-up-form' form={form} onSubmit={onSubmit} />
          {submitError && (
            <div className='text-red-500 dark:text-red-500'>{submitError}</div>
          )}
        </CardContent>
        <CardFooter className='flex-col gap-4'>
          <div className='flex w-full gap-2'>
            <Button asChild>
              <Link href='/' className='flex-1'>
                Back
              </Link>
            </Button>
            <Button
              form='sign-up-form'
              type='submit'
              variant='primary'
              className='flex-1'
            >
              {form.formState.isSubmitting ? (
                <Loader2 className='animate-spin' />
              ) : (
                'Continue'
              )}
            </Button>
          </div>
          <div>
            <p className='text-muted-foreground text-xs'>
              By creating an account you agree to the{' '}
              <Link
                href='terms'
                className='hover:text-vital-blue-700 underline'
              >
                Terms of Service
              </Link>{' '}
              and our{' '}
              <Link
                href='privacy'
                className='hover:text-vital-blue-700 underline'
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </CardFooter>
      </Card>
    </section>
  )
}

export default SignUp
