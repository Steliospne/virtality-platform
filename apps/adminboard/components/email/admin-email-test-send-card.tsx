'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@virtality/ui/components/card'
import { Input } from '@virtality/ui/components/input'
import { Label } from '@virtality/ui/components/label'
import { Send } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

type AdminEmailTestSendCardProps = {
  isPending: boolean
  onSend: (testRecipientEmail: string) => Promise<boolean>
}

export const AdminEmailTestSendCard = ({
  isPending,
  onSend,
}: AdminEmailTestSendCardProps) => {
  const [testRecipientEmail, setTestRecipientEmail] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!testRecipientEmail.includes('@')) {
      toast.error('Enter a valid test recipient email')
      return
    }

    const sent = await onSend(testRecipientEmail.trim())
    if (sent) {
      setTestRecipientEmail('')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test send</CardTitle>
        <CardDescription>
          Optional. Sends the rendered email, opt-out footer included, to one
          inbox.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className='flex flex-col gap-3 sm:flex-row sm:items-end'
        >
          <div className='flex-1'>
            <Label className='text-muted-foreground mb-1.5 block text-sm font-medium'>
              Test recipient
            </Label>
            <Input
              type='email'
              value={testRecipientEmail}
              onChange={(event) => setTestRecipientEmail(event.target.value)}
              placeholder='you@example.com'
            />
          </div>
          <Button type='submit' disabled={isPending}>
            <Send className='mr-2 size-4' />
            {isPending ? 'Sending...' : 'Send test'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
