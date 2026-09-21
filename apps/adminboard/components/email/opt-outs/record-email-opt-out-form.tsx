'use client'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getErrorMessage } from '@/lib/get-error-message'
import { useRecordEmailOptOut } from '@virtality/react-query'
import type { EmailOptOutScope } from '@virtality/shared/types'
import { listAdminEmailTopics } from '@virtality/shared/utils'
import { Input } from '@virtality/ui/components/input'
import { Label } from '@virtality/ui/components/label'
import { ShieldOff } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

const topics = listAdminEmailTopics()

type RecordEmailOptOutFormProps = {
  onRecorded?: () => void
}

/** Admins record an Opt-out on a recipient's request. There is no undo. */
export const RecordEmailOptOutForm = ({
  onRecorded,
}: RecordEmailOptOutFormProps) => {
  const [email, setEmail] = useState('')
  const [scope, setScope] = useState<EmailOptOutScope>('all')
  const [note, setNote] = useState('')
  const recordMutation = useRecordEmailOptOut()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!email.includes('@')) {
      toast.error('Enter a valid email')
      return
    }

    try {
      await recordMutation.mutateAsync({
        email: email.trim(),
        scope,
        note: note.trim() ? note : null,
      })
      toast.success('Opt-out recorded')
      setEmail('')
      setNote('')
      onRecorded?.()
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to record opt-out'))
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-3'>
      <div>
        <Label className='text-muted-foreground text-sm font-medium'>
          Email
        </Label>
        <Input
          className='mt-1'
          type='email'
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder='person@example.com'
        />
      </div>
      <div>
        <Label className='text-muted-foreground text-sm font-medium'>
          Scope
        </Label>
        <Select
          value={scope}
          onValueChange={(value) => setScope(value as EmailOptOutScope)}
        >
          <SelectTrigger className='mt-1'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All admin emails</SelectItem>
            {topics.map((topic) => (
              <SelectItem key={topic.id} value={topic.id}>
                {topic.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className='text-muted-foreground text-sm font-medium'>
          Note (optional)
        </Label>
        <Input
          className='mt-1'
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder='e.g. asked via support on 12 Sep'
        />
      </div>
      <Button type='submit' disabled={recordMutation.isPending}>
        <ShieldOff className='mr-2 size-4' />
        {recordMutation.isPending ? 'Recording...' : 'Record opt-out'}
      </Button>
    </form>
  )
}
