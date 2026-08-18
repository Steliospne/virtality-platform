'use client'
import { Input } from '@virtality/ui/components/input'
import { Button } from '@virtality/ui/components/button'
import { toast } from 'react-toastify'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CardContent, CardFooter } from '@virtality/ui/components/card'
import { FieldGroup } from '@/components/ui/field'
import { useORPC, useStartPasswordSetup } from '@virtality/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { ControllerField } from '@/components/ui/controller'
import {
  SetPasswordFormSchema,
  invalidateActivePendingPasswordChange,
  setPasswordFormField,
  type SetPasswordForm,
} from './profile-info-form'

export const SetPasswordField = () => {
  const orpc = useORPC()
  const queryClient = useQueryClient()
  const setPasswordForm = useForm<SetPasswordForm>({
    resolver: zodResolver(SetPasswordFormSchema),
    defaultValues: { newPassword: '' },
  })

  const { mutate: startPasswordSetup, isPending } = useStartPasswordSetup({
    onSuccess: async () => {
      setPasswordForm.reset({ newPassword: '' }, { keepDirty: false })
      await invalidateActivePendingPasswordChange(queryClient, orpc)
      toast.success('Check your email to approve password setup.')
    },
    onError: (error) => {
      console.error(error)
      toast.error('Failed to start password setup')
    },
  })

  const onSubmitSetPassword = (data: SetPasswordForm) => {
    startPasswordSetup({ newPassword: data.newPassword })
  }

  return (
    <form onSubmit={setPasswordForm.handleSubmit(onSubmitSetPassword)}>
      <CardContent>
        <p className='text-muted-foreground mb-4 text-sm'>
          You have not set a password yet. Add one to sign in with email and
          password.
        </p>
        <FieldGroup className='mb-6'>
          <ControllerField
            labelClassName='text-base'
            name='newPassword'
            control={setPasswordForm.control}
            meta={setPasswordFormField['newPassword']}
          >
            {({ field, fieldState }) => (
              <Input
                {...field}
                id={field.name}
                type='password'
                name={field.name}
                aria-invalid={fieldState.invalid}
                placeholder={setPasswordFormField['newPassword'].placeholder}
                value={(field.value ?? '') as string}
              />
            )}
          </ControllerField>
        </FieldGroup>
      </CardContent>
      <CardFooter className='border-t'>
        <Button
          type='submit'
          className='ml-auto'
          disabled={!setPasswordForm.formState.isDirty || isPending}
        >
          {isPending ? 'Sending...' : 'Set Password'}
        </Button>
      </CardFooter>
    </form>
  )
}
