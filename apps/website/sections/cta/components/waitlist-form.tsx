'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@virtality/ui/components/button'
import { Input } from '@virtality/ui/components/input'
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
import {
  captureWebsiteEvent,
  type WaitlistCtaLocation,
} from '@/lib/analytics-contract'

type WaitlistFormProps = {
  submitLabel?: string
  ctaLocation: WaitlistCtaLocation
}

const WaitlistForm = ({
  submitLabel = 'Join Waitlist',
  ctaLocation,
}: WaitlistFormProps) => {
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
            captureWebsiteEvent(
              'waitlist_joined',
              { cta_location: ctaLocation },
              { email: values.email },
            )
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
                  <div className='flex flex-row overflow-hidden rounded-xl border-2 border-vital-blue-100 focus-within:border-vital-blue-700 focus-within:ring-2 focus-within:ring-vital-blue-700/20'>
                    <Input
                      type='email'
                      placeholder='Enter your email'
                      required
                      className='h-14 min-w-0 flex-1 rounded-none border-0 px-5 text-base shadow-none focus-visible:ring-0'
                      {...field}
                    />
                    <Button
                      type='submit'
                      variant='primary'
                      className='h-14 shrink-0 rounded-none px-6 text-base font-semibold shadow-none group'
                    >
                      {isCreating || isSending ? 'Submitting...' : submitLabel}
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
