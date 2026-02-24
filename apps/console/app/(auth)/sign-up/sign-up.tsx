'use client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { SignUpSchema } from '@/lib/definitions'
import { SignUpForm } from '@/types/models'
import { authClient } from '@/auth-client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useClientT } from '@/i18n/use-client-t'
import { Loader2 } from 'lucide-react'
import SignupForm from '@/components/auth/sign-up-form'

const SignUp = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const referralCode = searchParams.get('referralCode')
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
      callbackURL: process.env.NEXT_PUBLIC_DOMAIN_URL,
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
