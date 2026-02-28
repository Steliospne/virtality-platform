'use client'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form-legacy'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { NewUserFormSchema } from '@/types/definitions'
import { NewUserForm } from '@/types/models'
import capitalize from 'lodash.capitalize'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card'
import Link from 'next/link'
import { authClient } from '@/auth-client'

const defaultValues: NewUserForm = {
  name: '',
  email: '',
  password: '',
  passwordConf: '',
  role: 'user',
}

const UserForm = ({
  dialog,
  isDialogOpen,
  setDialogOpen,
}: {
  dialog?: boolean
  isDialogOpen?: boolean
  setDialogOpen?: (value: boolean) => void
}) => {
  const roles = ['user', 'admin']

  const form = useForm<NewUserForm>({
    resolver: zodResolver(NewUserFormSchema),
    mode: 'all',
    criteriaMode: 'all',
    defaultValues,
  })

  const onSubmit = async (values: NewUserForm) => {
    console.log(values)
    await authClient.admin.createUser({ ...values })
  }

  if (!dialog)
    return (
      <Card className='w-full max-w-xl'>
        <CardHeader>
          <CardTitle>Create New User</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
              <FormField
                name='name'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='data-[error=true]:text-red-500 dark:data-[error=true]:text-red-500'>
                      {capitalize(field.name)}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage className='text-red-500 dark:text-red-500' />
                  </FormItem>
                )}
              />

              <FormField
                name='email'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='data-[error=true]:text-red-500 dark:data-[error=true]:text-red-500'>
                      {capitalize(field.name)}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type='email' />
                    </FormControl>
                    <FormMessage className='text-red-500 dark:text-red-500' />
                  </FormItem>
                )}
              />

              <FormField
                name='password'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='data-[error=true]:text-red-500 dark:data-[error=true]:text-red-500'>
                      {capitalize(field.name)}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type='password' />
                    </FormControl>
                    <FormMessage className='text-red-500 dark:text-red-500' />
                  </FormItem>
                )}
              />

              <FormField
                name='passwordConf'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='data-[error=true]:text-red-500 dark:data-[error=true]:text-red-500'>
                      Password Confirmation
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type='password' />
                    </FormControl>
                    <FormMessage className='text-red-500 dark:text-red-500' />
                  </FormItem>
                )}
              />

              <FormField
                name='role'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel
                      htmlFor={field.name}
                      className='data-[error=true]:text-red-500 dark:data-[error=true]:text-red-500'
                    >
                      {capitalize(field.name)}
                    </FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger id={field.name} className='w-full'>
                          <SelectValue placeholder='Select a role...' />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role} value={role}>
                              {capitalize(role)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage className='text-red-500 dark:text-red-500' />
                  </FormItem>
                )}
              />

              <CardFooter className='justify-end gap-4'>
                <Button asChild type='button'>
                  <Link href='/'>Cancel</Link>
                </Button>
                <Button>Create</Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    )

  return (
    <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              name='name'
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='data-[error=true]:text-red-500 dark:data-[error=true]:text-red-500'>
                    {capitalize(field.name)}
                  </FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage className='text-red-500 dark:text-red-500' />
                </FormItem>
              )}
            />

            <FormField
              name='email'
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='data-[error=true]:text-red-500 dark:data-[error=true]:text-red-500'>
                    {capitalize(field.name)}
                  </FormLabel>
                  <FormControl>
                    <Input {...field} type='email' />
                  </FormControl>
                  <FormMessage className='text-red-500 dark:text-red-500' />
                </FormItem>
              )}
            />

            <FormField
              name='password'
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='data-[error=true]:text-red-500 dark:data-[error=true]:text-red-500'>
                    {capitalize(field.name)}
                  </FormLabel>
                  <FormControl>
                    <Input {...field} type='password' />
                  </FormControl>
                  <FormMessage className='text-red-500 dark:text-red-500' />
                </FormItem>
              )}
            />

            <FormField
              name='passwordConf'
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='data-[error=true]:text-red-500 dark:data-[error=true]:text-red-500'>
                    Password Confirmation
                  </FormLabel>
                  <FormControl>
                    <Input {...field} type='password' />
                  </FormControl>
                  <FormMessage className='text-red-500 dark:text-red-500' />
                </FormItem>
              )}
            />

            <FormField
              name='role'
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel
                    htmlFor={field.name}
                    className='data-[error=true]:text-red-500 dark:data-[error=true]:text-red-500'
                  >
                    {capitalize(field.name)}
                  </FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger id={field.name} className='w-full'>
                        <SelectValue placeholder='Select a role...' />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {capitalize(role)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage className='text-red-500 dark:text-red-500' />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button asChild type='button'>
                <DialogClose>Cancel</DialogClose>
              </Button>
              <Button>Create</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default UserForm
