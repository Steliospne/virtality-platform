'use client'
import { authClient } from '@/auth-client'
import { Button } from '@virtality/ui/components/button'
import { Input } from '@virtality/ui/components/input'
import { SignInForm, SignInSchema } from '@/lib/definitions'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ChangeEvent, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Field, FieldError, FieldLabel } from '../ui/field'
import { warmUpSocketServer } from '@/lib/warm-up-socket-server'

type SignInDataType = {
  email: string
  password: string
}

const EmailSignIn = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [signInData, setSignInData] = useState<SignInDataType>({
    email: '',
    password: '',
  })

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const target = e.target
    const { value, name } = target
    setSignInData({ ...signInData, [name]: value })
  }

  const form = useForm<SignInForm>({
    resolver: zodResolver(SignInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (values: SignInForm) => {
    if (signInData) {
      setLoading(true)
      try {
        await authClient.signIn.email({
          ...values,
          fetchOptions: {
            onSuccess: () => {
              void warmUpSocketServer()
              router.push('/')
            },
            onError: (ctx) => {
              setLoading(false)
              setAuthError(ctx.error.message)
            },
          },
        })
      } catch (error) {
        console.error('Error signing in: ', error)
        setLoading(false)
        setAuthError('Unexpected error occurred. Please contact support.')
      }
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className='flex flex-col gap-2'>
        <Controller
          name='email'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Email *</FieldLabel>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                type='email'
              />

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name='password'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Password *</FieldLabel>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                type='password'
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Button type='submit' size='lg' disabled={loading}>
          {loading ? <Loader2 className='animate-spin' /> : 'Sign In'}
        </Button>
        {authError && <div className='text-red-500'>{authError}</div>}
      </div>
    </form>
  )
}

export default EmailSignIn
