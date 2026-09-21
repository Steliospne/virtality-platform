'use client'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@virtality/ui/components/input'
import { Label } from '@virtality/ui/components/label'
import { FlaskConical } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

type TestSendPopoverProps = {
  isPending: boolean
  onSend: (testRecipientEmail: string) => Promise<boolean>
  size?: 'sm' | 'default'
  className?: string
}

/** Test send as a toolbar button with the recipient in a popover. */
export const TestSendPopover = ({
  isPending,
  onSend,
  size = 'sm',
  className,
}: TestSendPopoverProps) => {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!email.includes('@')) {
      toast.error('Enter a valid test recipient email')
      return
    }
    const sent = await onSend(email.trim())
    if (sent) {
      setEmail('')
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='outline'
          size={size}
          className={className}
        >
          <FlaskConical className='mr-1.5 size-4' />
          Test send
        </Button>
      </PopoverTrigger>
      <PopoverContent align='end' className='w-80'>
        <form onSubmit={handleSubmit} className='space-y-3'>
          <div>
            <Label className='text-muted-foreground mb-1.5 block text-sm font-medium'>
              Send a test to
            </Label>
            <Input
              type='email'
              autoFocus
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder='you@example.com'
            />
            <p className='text-muted-foreground mt-1 text-xs'>
              Saves the draft first. Opt-out footer included.
            </p>
          </div>
          <Button type='submit' size='sm' disabled={isPending}>
            {isPending ? 'Sending…' : 'Send test'}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  )
}
