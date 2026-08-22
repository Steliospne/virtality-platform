import { Input } from '@virtality/ui/components/input'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { SignUpForm } from '@/lib/definitions'
import { UseFormReturn } from 'react-hook-form'
import { User } from '@/auth-client'
import { getPasswordRequirementStatus } from '@virtality/shared/utils'

interface SignupFormProps {
  id?: string
  form: UseFormReturn<SignUpForm>
  onSubmit: (values: SignUpForm | (SignUpForm & { role: User['role'] })) => void
}

const SignupForm = ({ id, form, onSubmit }: SignupFormProps) => {
  const formPwdErrorType = form.formState.errors.password?.types
  const password = form.watch('password')
  const passwordRequirementStatus = getPasswordRequirementStatus(password)

  return (
    <Form {...form}>
      <form
        id={id}
        onSubmit={form.handleSubmit(onSubmit)}
        className='space-y-4'
      >
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password *</FormLabel>
              <FormControl>
                <Input type='password' {...field} value={field.value ?? ''} />
              </FormControl>

              {formPwdErrorType?.['length'] ? (
                <FormDescription className='text-red-500 dark:text-red-500'>
                  {formPwdErrorType['length']}
                </FormDescription>
              ) : (
                <FormDescription>
                  {'• Password must be between 8 and 16 characters long. '}
                  {password && passwordRequirementStatus.length && (
                    <span className='text-green-500'>✓</span>
                  )}
                </FormDescription>
              )}

              {formPwdErrorType?.['uppercase'] ? (
                <FormDescription className='text-red-500 dark:text-red-500'>
                  {formPwdErrorType['uppercase']}
                </FormDescription>
              ) : (
                <FormDescription>
                  {'• Password must contain at least one uppercase letter. '}
                  {password && passwordRequirementStatus.uppercase && (
                    <span className='text-green-500'>✓</span>
                  )}
                </FormDescription>
              )}

              {formPwdErrorType?.['lowercase'] ? (
                <FormDescription className='text-red-500 dark:text-red-500'>
                  {formPwdErrorType['lowercase']}
                </FormDescription>
              ) : (
                <FormDescription>
                  {'• Password must contain at least one lowercase letter. '}
                  {password && passwordRequirementStatus.lowercase && (
                    <span className='text-green-500'>✓</span>
                  )}
                </FormDescription>
              )}

              {formPwdErrorType?.['digit'] ? (
                <FormDescription className='text-red-500 dark:text-red-500'>
                  {formPwdErrorType['digit']}
                </FormDescription>
              ) : (
                <FormDescription>
                  {'• Password must contain at least one digit. '}
                  {password && passwordRequirementStatus.digit && (
                    <span className='text-green-500'>✓</span>
                  )}
                </FormDescription>
              )}
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}

export default SignupForm
