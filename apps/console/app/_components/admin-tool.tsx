'use client'

import { Button } from '@/components/ui/button'
import { GripVertical } from 'lucide-react'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { ChangeEvent, useState } from 'react'
import { authClient } from '@/auth-client'
import useIsAuthed from '@/hooks/use-is-authed'

const AdminTool = ({ isImpersonating }: { isImpersonating?: boolean }) => {
  const { data } = useIsAuthed()
  const user = data?.user
  const [open, setOpen] = useState(false)
  const [host, setHost] = useState('')

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const target = e.currentTarget
    const { value } = target
    setHost(value)
  }

  const handleImpersonate = async () => {
    if (host === '') return

    const { error } = await authClient.admin.impersonateUser({
      userId: host, // required
    })

    if (error) {
      console.error('[Error]: ', error.code, ', message: ', error.message)
      return
    }

    setHost('')
    window.location.reload()
  }

  const handleStopImpersonate = async () => {
    const { error } = await authClient.admin.stopImpersonating()
    if (error) {
      console.error('[Error]: ', error.code, ', message: ', error.message)
      return
    }
    window.location.reload()
  }

  const testVerificationEmail = async () => {
    try {
      await authClient.sendVerificationEmail({
        email: 's.pnevmatikakis@virtality.app',
        callbackURL: 'http://localhost:3001',
      })
    } catch (error) {
      console.log('Error sending verification email: ', error)
    }
  }

  return (
    <Popover open={open}>
      <PopoverTrigger asChild>
        {(user?.role === 'admin' || isImpersonating) && (
          <Button
            onClick={() => setOpen(!open)}
            className='absolute top-10 right-0 h-10 rounded-l-full pr-1 hover:w-11.5'
          >
            <GripVertical />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent>
        <div className='grid grid-rows-2 gap-1'>
          <Label htmlFor='userId'>User ID</Label>
          <Input
            type='text'
            id='userId'
            value={host}
            onChange={handleInputChange}
          />

          <Button onClick={handleImpersonate}>Impersonate</Button>
          <Button onClick={handleStopImpersonate}>Stop Impersonate</Button>
          <Button disabled onClick={testVerificationEmail}>
            Send Email
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default AdminTool
