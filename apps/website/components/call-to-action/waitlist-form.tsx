'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import { WaitlistFormType } from '@/types/models'
import { zodResolver } from '@hookform/resolvers/zod'
import { WaitlistFormSchema } from '@/lib/definitions'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { toast } from 'sonner'
import { ArrowRight } from 'lucide-react'
import { useCreateWaitlist } from '@virtality/react-query'
import { useSendThankYouEmail } from '@virtality/react-query'

const WaitlistForm = () => {
  const router = useRouter()
  const { mutate: createWaitlist, isPending: isCreating } = useCreateWaitlist()
  const { mutate: sendThankYouEmail, isPending: isSending } =
    useSendThankYouEmail()

  const form = useForm<WaitlistFormType>({
    resolver: zodResolver(WaitlistFormSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = (values: WaitlistFormType) => {
    createWaitlist(
      { email: values.email },
      {
        onSuccess: (data) => {
          if (data.success) {
            toast.success('Thank you for joining the waitlist!')
            form.reset()
            sendThankYouEmail({ email: values.email })
            router.push('/thank-you')
          } else {
            toast.error(data.message)
          }
        },
      },
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className='flex flex-col gap-4'>
          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className='flex flex-col sm:flex-row gap-3'>
                    <Input
                      type='email'
                      placeholder='Enter your professional email'
                      required
                      className='flex-1 h-14 px-5 text-base border-2 border-vital-blue-100 focus:border-vital-blue-700 focus:ring-2 focus:ring-vital-blue-700/20 rounded-xl'
                      {...field}
                    />
                    <Button
                      type='submit'
                      className='h-14 px-6 text-base font-semibold bg-vital-blue-700 hover:bg-vital-blue-800 shadow-lg shadow-vital-blue-700/25 hover:shadow-xl hover:shadow-vital-blue-700/30 transition-all rounded-xl group'
                    >
                      {isCreating || isSending
                        ? 'Submitting...'
                        : 'Join Waitlist'}
                      <ArrowRight className='size-4 ml-2 group-hover:translate-x-1 transition-transform' />
                    </Button>
                  </div>
                </FormControl>
                <FormMessage className='text-red-700' />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  )
}

export default WaitlistForm
