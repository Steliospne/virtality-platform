'use client'
import { Input } from '@virtality/ui/components/input'
import { Button } from '@virtality/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@virtality/ui/components/card'
import Link from 'next/link'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod/v4'
import { authClient } from '@/auth-client'
import { CheckCircle } from 'lucide-react'
import {
  CONSOLE_URL,
  CONSOLE_URL_STAGING,
  CONSOLE_URL_LOCAL,
} from '@virtality/shared/types'

const env = process.env.NEXT_PUBLIC_ENV || 'development'

const baseURL =
  env === 'production'
    ? CONSOLE_URL
    : env === 'preview'
      ? CONSOLE_URL_STAGING
      : CONSOLE_URL_LOCAL

const ResetSchema = z.object({
  email: z.email({ message: '• Provide valid email (example@domain.com)' }),
})

type ForgotForm = z.infer<typeof ResetSchema>

const ForgotForm = () => {
  const form = useForm<ForgotForm>({
    resolver: zodResolver(ResetSchema),
    mode: 'onChange',
    defaultValues: { email: '' },
  })

  const onSubmit = async (values: ForgotForm) => {
    const { email } = values
    await authClient.requestPasswordReset({
      email,
      redirectTo: baseURL + '/reset-password',
    })
  }

  const { isSubmitSuccessful, isSubmitting } = form.formState
  return (
    <Card className='w-full max-w-lg'>
      <CardHeader>
        <CardTitle className='text-2xl font-bold'>
          Reset your password
        </CardTitle>
        <CardDescription className='text-muted-foreground text-sm'>
          Enter your account email and we will send a link to reset your
          password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSubmitSuccessful ? (
          <div>
            <CheckCircle />
            <p>Reset email was send successfully, check your email.</p>
          </div>
        ) : (
          <Form {...form}>
            <form
              id='reset-password-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4'
            >
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type='email' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
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
            form='reset-password-form'
            type='submit'
            variant='primary'
            className='flex-1'
            disabled={isSubmitSuccessful}
          >
            {isSubmitting ? 'Sending...' : 'Send reset email'}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

export default ForgotForm
