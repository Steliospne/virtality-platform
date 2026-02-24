'use client'
import { Mail, Send, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { ContactFormSchema } from '@/lib/definitions'
import { zodResolver } from '@hookform/resolvers/zod'
import { startTransition, useActionState, useState } from 'react'
import { submitContactMsg } from '@/lib/actions'
import { ContactForm } from '@/types/models'

const initialFormState: ContactForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  message: '',
}

const ContactUs = () => {
  const form = useForm<ContactForm>({
    resolver: zodResolver(ContactFormSchema),
    mode: 'onChange',
    defaultValues: initialFormState,
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [formState, formAction] = useActionState(
    submitContactMsg,
    initialFormState,
  )

  const [isSubmitted, setIsSubmitted] = useState(false)

  const onSubmit = (values: ContactForm) => {
    const formData = new FormData()
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString())
      }
    })

    startTransition(() => formAction(formData))
    form.reset()
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <Card>
        <CardContent className='pt-6'>
          <div className='text-center space-y-4'>
            <div className='size-16 bg-green-100 rounded-full flex items-center justify-center mx-auto'>
              <Mail className='size-8 text-green-600' />
            </div>
            <h3 className='text-xl font-semibold text-gray-900'>
              Message Submitted!
            </h3>
            <p className='text-gray-600'>
              {
                "We received your message. We'll do our best to get back to you as fast as possible."
              }
            </p>
            <Button
              onClick={() => {
                setIsSubmitted(false)
                window.location.reload()
              }}
              variant='outline'
            >
              Send Another Message
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <section className='min-h-screen-with-nav flex justify-center bg-gradient-to-br from-slate-50 to-white max-lg:py-10'>
      <div className='m-auto'>
        <div className='text-center mb-6'>
          <div className='inline-block bg-vital-blue-700/10 text-vital-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6'>
            Get In Touch
          </div>
          <h1 className='text-4xl md:text-5xl font-bold text-gray-900 mb-6'>
            Contact <span className='text-vital-blue-700'>Virtality</span>
          </h1>
          <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
            {
              "Ready to transform patient recovery with VR technology? We'd love to hear from you. Reach out to learn more about our innovative rehabilitation solutions."
            }
          </p>
        </div>
        <div className='grid lg:grid-cols-3 gap-8'>
          {/* Contact Form */}
          <div className='lg:col-span-2'>
            <Card className='border-vital-blue-700/20 h-full'>
              <CardHeader>
                <CardTitle className='text-2xl text-gray-900 flex items-center gap-2'>
                  <MessageSquare className='size-6 text-vital-blue-700' />
                  Send us a Message
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-6 flex flex-col h-full'>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className='space-y-4'
                  >
                    <div className='grid md:grid-cols-2 gap-4'>
                      <FormField
                        control={form.control}
                        name='firstName'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name *</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className='focus-visible:border-vital-blue-700/40 focus-visible:ring-vital-blue-700/40'
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='lastName'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name *</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className='focus-visible:border-vital-blue-700/40 focus-visible:ring-vital-blue-700/40'
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className='grid md:grid-cols-2 gap-4'>
                      <FormField
                        control={form.control}
                        name='email'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address *</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className='focus-visible:border-vital-blue-700/40 focus-visible:ring-vital-blue-700/40'
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='phone'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number *</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className='focus-visible:border-vital-blue-700/40 focus-visible:ring-vital-blue-700/40'
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className='space-y-2 flex-1'>
                      <FormField
                        control={form.control}
                        name='message'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message *</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder='Tell us more about your needs or share anything you would like about our product...'
                                rows={6}
                                {...field}
                                className='focus:border-vital-blue-700/40! focus:ring-vital-blue-700/40! h-full'
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button className='w-full bg-vital-blue-700 hover:bg-[#077a89] text-white py-3'>
                      <Send className='mr-2' />
                      Send Message
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className='space-y-6'>
            {/* Contact Details */}
            <Card className='border-vital-blue-700/20'>
              <CardHeader>
                <CardTitle className='text-xl text-gray-900'>
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-start gap-3'>
                  <Mail className='size-5 text-vital-blue-700 mt-1' />
                  <div>
                    <p className='font-medium text-gray-900'>Email</p>
                    <p className='text-gray-600'>info@virtality.app</p>
                    <p className='text-gray-600'>support@virtality.app</p>
                  </div>
                </div>
                {/* <div className='flex items-start gap-3'>
                  <Phone className='w-5 h-5 text-vital-blue-700 mt-1' />
                  <div>
                    <p className='font-medium text-gray-900'>Phone</p>
                    <p className='text-gray-600'>+99 99999 99999</p>
                  </div>
                </div>
                <div className='flex items-start gap-3'>
                  <MapPin className='w-5 h-5 text-vital-blue-700 mt-1' />
                  <div>
                    <p className='font-medium text-gray-900'>Address</p>
                    <p className='text-gray-600'>
                      123 Innovation Drive
                      <br />
                      Healthcare District
                      <br />
                      San Francisco, CA 94105
                    </p>
                  </div>
                </div> */}
              </CardContent>
            </Card>
            {/* Business Hours */}
            {/* <Card className='border-vital-blue-700/20'>
              <CardHeader>
                <CardTitle className='text-xl text-gray-900 flex items-center gap-2'>
                  <Clock className='w-5 h-5 text-vital-blue-700' />
                  Business Hours
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-2'>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Monday - Friday</span>
                  <span className='font-medium text-gray-900'>
                    9:00 AM - 6:00 PM
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Saturday</span>
                  <span className='font-medium text-gray-900'>
                    10:00 AM - 4:00 PM
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Sunday</span>
                  <span className='font-medium text-gray-900'>Closed</span>
                </div>
                <div className='pt-2 border-t border-gray-200'>
                  <p className='text-sm text-gray-500'>
                    Emergency support available 24/7 for existing clients
                  </p>
                </div>
              </CardContent>
            </Card> */}
          </div>
        </div>
      </div>
    </section>
  )
}

export default ContactUs
