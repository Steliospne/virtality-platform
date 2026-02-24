'use client'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardFooter } from '@/components/ui/card'

type CalendarData = {
  date?: Date
  time: string | null
}

export default function BookingCalendar({
  data,
  onChange,
}: {
  data: CalendarData
  onChange: (value: CalendarData) => void
}) {
  const timeSlots = Array.from({ length: 17 }, (_, i) => {
    const totalMinutes = i * 30
    const hour = Math.floor(totalMinutes / 60) + 9
    const minute = totalMinutes % 60
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  })

  const disabledTimeSlot = (index: number) => {
    const now = new Date()
    const today = data.date?.toLocaleDateString() === now.toLocaleDateString()
    const [time, indicator] = [...now.toLocaleTimeString().split(' ')]

    if (!time || !indicator) throw new Error('Invalid time')

    let [hour, minute] = [...time.split(':', 2)]

    if (!hour || !minute) throw new Error('Invalid hour or minute')

    hour = indicator === 'PM' ? `${Number(hour) + 12}` : hour.padStart(2, '0')
    minute = Number(minute) < 30 ? '00' : '30'
    const newTime = [hour, minute].join(':')
    const disabledIndex = timeSlots.indexOf(newTime)
    const tooEarly = Number(hour.split(':', 1)[0]) < 9
    if (today) {
      return tooEarly
        ? false
        : disabledIndex === -1
          ? index < timeSlots.length
          : index <= disabledIndex
    } else if (now < data.date!) {
      return false
    } else {
      return true
    }
  }

  // In the future we'll sync our booked dates with the backend
  const bookedDates = Array.from(
    { length: 0 },
    (_, i) => new Date(2025, 5, 17 + i),
  )

  return (
    <Card className='gap-0 p-0'>
      <CardContent className='relative p-0 md:pr-48'>
        <div className='p-6 place-items-center'>
          <Calendar
            mode='single'
            selected={data.date}
            onSelect={(value) => {
              onChange({ time: null, date: value })
            }}
            defaultMonth={data.date}
            disabled={bookedDates}
            showOutsideDays={false}
            modifiers={{
              booked: bookedDates,
            }}
            modifiersClassNames={{
              booked: '[&>button]:line-through opacity-100',
            }}
            className='bg-transparent p-0 [--cell-size:--spacing(10)] md:[--cell-size:--spacing(12)]'
            formatters={{
              formatWeekdayName: (date) => {
                return date.toLocaleString('en-US', { weekday: 'short' })
              },
            }}
          />
        </div>
        <div className='no-scrollbar inset-y-0 right-0 flex max-h-72 w-full scroll-pb-6 flex-col gap-4 overflow-y-auto border-t p-6 md:absolute md:max-h-none md:w-48 md:border-t-0 md:border-l'>
          <div className='grid gap-2'>
            {timeSlots.map((time, idx) => (
              <Button
                key={time}
                type='button'
                disabled={disabledTimeSlot(idx)}
                variant={data.time === time ? 'primary' : 'outline'}
                onClick={() => onChange({ ...data, time })}
                className='w-full shadow-none'
              >
                {time}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className='flex flex-col gap-4 border-t px-6 !py-5 md:flex-row'>
        <div className='text-sm'>
          {data.date && data.time ? (
            <>
              Your meeting is booked for{' '}
              <span className='font-medium'>
                {' '}
                {data.date?.toLocaleDateString('en-US', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}{' '}
              </span>
              at <span className='font-medium'>{data.time}</span>.
            </>
          ) : (
            <>Select a date and time for your meeting.</>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
