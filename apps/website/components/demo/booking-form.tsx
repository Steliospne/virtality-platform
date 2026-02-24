'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  CalendarIcon as CalendarIcon,
  User,
  Mail,
  MessageSquare,
  Clock,
} from 'lucide-react'
import { submitBooking } from '@/lib/actions'
import BookingCalendar from '@/components/booking-calendar'
import Link from 'next/link'

export function BookingForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [calendarData, setCalendarData] = useState<{
    date?: Date
    time: string | null
  }>({
    date: new Date(),
    time: '',
  })

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    Object.entries(calendarData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString())
      }
    })
    try {
      await submitBooking(formData)
      setIsSubmitted(true)
    } catch (error) {
      console.error('Error submitting booking:', error)
      alert('Failed to submit booking. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <Card>
        <CardContent className='pt-6'>
          <div className='text-center space-y-4'>
            <div className='size-16 bg-green-100 rounded-full flex items-center justify-center mx-auto'>
              <CalendarIcon className='size-8 text-green-600' />
            </div>
            <h3 className='text-xl font-semibold text-gray-900'>
              Booking Submitted!
            </h3>
            <p className='text-gray-600'>
              {
                "Your appointment request has been sent. You'll receive a confirmation shortly."
              }
            </p>
            <Button
              onClick={() => {
                setIsSubmitted(false)
                window.location.reload()
              }}
              variant='outline'
            >
              Book Another Appointment
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <CalendarIcon className='size-5' />
          Appointment Details
        </CardTitle>
        <CardDescription className='bg-gray-50 border border-gray-200 rounded-2xl p-6 max-w-xl mx-auto my-8'>
          <div className='flex items-center mb-4 gap-2'>
            <Clock />
            <h3 className='text-lg font-semibold text-gray-800'>
              Time Zone Notice
            </h3>
          </div>
          <p className='text-gray-700 mb-3'>
            All available appointment times are listed in{' '}
            <span className='font-medium'>Athens, Greece (GMT+3)</span> local
            time. Please double-check your own time zone before booking to avoid
            any confusion.
          </p>
          <p className='text-gray-700'>
            If you need an appointment{' '}
            <span className='font-medium'>outside the available hours</span>,
            feel free to{' '}
            <Link
              href='mailto:info@virtality.app'
              className='text-blue-600 hover:underline'
            >
              email us directly
            </Link>{' '}
            to request a custom time.
          </p>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='name' className='flex items-center gap-2'>
                <User className='size-4' />
                Full Name
              </Label>
              <Input
                id='name'
                name='name'
                type='text'
                placeholder='John Doe'
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='email' className='flex items-center gap-2'>
                <Mail className='size-4' />
                Email
              </Label>
              <Input
                id='email'
                name='email'
                type='email'
                placeholder='john@example.com'
                required
              />
            </div>
          </div>

          <BookingCalendar data={calendarData} onChange={setCalendarData} />

          <div className='space-y-2'>
            <Label htmlFor='notes' className='flex items-center gap-2'>
              <MessageSquare className='size-4' />
              Additional Notes (Optional)
            </Label>
            <Textarea
              id='notes'
              name='notes'
              placeholder='Any specific requirements or notes about your appointment...'
              rows={3}
            />
          </div>

          <Button type='submit' className='w-full' disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Book Appointment'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
