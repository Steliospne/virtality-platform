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
import { UseFormReturn, useWatch } from 'react-hook-form'
import { User } from '@/auth-client'
import { getPasswordRequirementStatus } from '@virtality/shared/utils'

interface SignupFormProps {
  id?: string
  form: UseFormReturn<SignUpForm>
  onSubmit: (values: SignUpForm | (SignUpForm & { role: User['role'] })) => void
}

const PasswordRequirement = ({
  satisfied,
  label,
}: {
  satisfied: boolean
  label: string
}) => (
  <FormDescription>
    <span
      className={
        satisfied
          ? 'text-green-500 dark:text-green-500'
          : 'text-red-500 dark:text-red-500'
      }
    >
      {satisfied ? '✓' : '✗'}
    </span>{' '}
    {label}
  </FormDescription>
)

const SignupForm = ({ id, form, onSubmit }: SignupFormProps) => {
  const password = useWatch({ control: form.control, name: 'password' }) ?? ''
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

              <PasswordRequirement
                satisfied={passwordRequirementStatus.length}
                label='Password must be between 8 and 16 characters long.'
              />
              <PasswordRequirement
                satisfied={passwordRequirementStatus.uppercase}
                label='Password must contain at least one uppercase letter.'
              />
              <PasswordRequirement
                satisfied={passwordRequirementStatus.lowercase}
                label='Password must contain at least one lowercase letter.'
              />
              <PasswordRequirement
                satisfied={passwordRequirementStatus.digit}
                label='Password must contain at least one digit.'
              />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}

export default SignupForm
