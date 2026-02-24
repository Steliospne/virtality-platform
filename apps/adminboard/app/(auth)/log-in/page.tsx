'use client';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { LoginForm } from '@/types/models';
import { useForm } from 'react-hook-form';
import { LoginFormSchema } from '@/types/definitions';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form-legacy';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useUnmount } from '@/hooks/use-unmount';
import { authClient } from '@/auth-client';
const defaultValues = {
  email: '',
  password: '',
};

const LogIn = () => {
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<{
    code?: string | undefined;
    message?: string | undefined;
    status: number;
    statusText: string;
  } | null>(null);

  const form = useForm<LoginForm>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues,
  });

  const onSubmit = async (values: LoginForm) => {
    setLoading(!loading);

    const { error } = await authClient.signIn.email({
      ...values,
      callbackURL: '/',
    });
    setLoginError(error);
  };

  useUnmount(() => setLoading(false));

  return (
    <div className='flex h-svh flex-col items-center justify-center gap-4 dark:bg-zinc-800'>
      <h1 className='text-3xl font-bold dark:text-zinc-200'>Adminboard</h1>
      <div className='flex w-full max-w-lg flex-col gap-4 rounded-lg p-8 dark:bg-zinc-800'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <hr className='text-white' />
            <div className='mt-4 flex flex-col gap-4'>
              <FormField
                name='email'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='data-[error=true]:text-red-500 dark:data-[error=true]:text-red-500'>
                      Email *
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
                      Password *
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type='password' />
                    </FormControl>
                    <FormMessage className='text-red-500 dark:text-red-500' />
                  </FormItem>
                )}
              />

              <FormMessage className='text-red-500 dark:text-red-500'>
                {loginError?.message ?? ''}
              </FormMessage>

              <div className='flex flex-col'>
                <Button type='submit'>
                  {loading ? (
                    <span className='flex items-center gap-2'>
                      <Loader2 className='animate-spin' /> Loading
                    </span>
                  ) : (
                    'Login'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default LogIn;
