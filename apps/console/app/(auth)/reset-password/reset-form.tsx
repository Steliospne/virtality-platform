'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { isValidPassword } from '@/lib/utils'
import { z } from 'zod/v4'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { authClient } from '@/auth-client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const ResetSchema = z.object({
  newPassword: z.string().check(isValidPassword),
})

type ResetForm = z.infer<typeof ResetSchema>
const ResetForm = ({ token }: { token?: string }) => {
  const router = useRouter()
  const [formError, setFormError] = useState<string | undefined | null>(null)

  const form = useForm<ResetForm>({
    resolver: zodResolver(ResetSchema),
    mode: 'onChange',
    defaultValues: { newPassword: '' },
  })

  const { isSubmitting } = form.formState

  if (!token) {
    throw Error('Invalid Token')
  }

  const onSubmit = async (values: ResetForm) => {
    const { newPassword } = values

    try {
      const { error } = await authClient.resetPassword({ newPassword, token })

      if (error) setFormError(error.message)
      console.log(error)
      if (!formError) {
        router.push('/')
      }
    } catch (error) {
      console.log('Error resetting password: ', error)
    }
  }

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
        <Form {...form}>
          <form
            id='reset-password-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='newPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input {...field} type='password' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
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
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

export default ResetForm
