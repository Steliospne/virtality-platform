'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ShieldOff } from 'lucide-react'
import { useState } from 'react'
import { RecordEmailOptOutForm } from './record-email-opt-out-form'

export const RecordEmailOptOutDialog = () => {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type='button'>
          <ShieldOff className='mr-2 size-4' />
          Record opt-out
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Record an opt-out</DialogTitle>
          <DialogDescription>
            On a recipient&apos;s request. Opt-outs are never reversed from
            here.
          </DialogDescription>
        </DialogHeader>
        <RecordEmailOptOutForm onRecorded={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
