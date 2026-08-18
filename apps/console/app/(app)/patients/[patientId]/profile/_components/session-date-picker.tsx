'use client'

import { Label } from '@virtality/ui/components/label'
import { Button } from '@virtality/ui/components/button'
import { Calendar } from '@virtality/ui/components/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const DATE_PICKER_BUTTON_CLASS = cn(
  'h-9 w-[200px] justify-start pl-3 text-left font-normal',
  'border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900/50 dark:hover:bg-zinc-800/50',
)

interface SessionDatePickerProps {
  label: string
  selected: Date
  onSelect: (date: Date) => void
  isDateDisabled: (date: Date) => boolean
}

export function SessionDatePicker({
  label,
  selected,
  onSelect,
  isDateDisabled,
}: SessionDatePickerProps) {
  return (
    <div className='flex flex-col gap-2'>
      <Label className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>
        {label}
      </Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant='outline' className={DATE_PICKER_BUTTON_CLASS}>
            {format(selected, 'PPP')}
            <CalendarIcon className='ml-auto size-4 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align='start'>
          <Calendar
            mode='single'
            selected={selected}
            onSelect={(value) => value && onSelect(value)}
            disabled={isDateDisabled}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
