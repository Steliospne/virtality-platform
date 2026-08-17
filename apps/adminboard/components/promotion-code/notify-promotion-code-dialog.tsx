'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getErrorMessage } from '@/lib/get-error-message'
import { useNotifyPromotionCodeInApp, useUsers } from '@virtality/react-query'
import type { PromotionCodeRecord } from '@virtality/shared/utils'
import { Label } from '@virtality/ui/components/label'
import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'

type NotifyPromotionCodeDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  promotionCode: PromotionCodeRecord
}

export function NotifyPromotionCodeDialog({
  open,
  onOpenChange,
  promotionCode,
}: NotifyPromotionCodeDialogProps) {
  const [userId, setUserId] = useState('')
  const { data, isPending: usersPending } = useUsers()
  const users = data?.data?.users ?? []
  const { mutate: notifyInApp, isPending } = useNotifyPromotionCodeInApp()

  useEffect(() => {
    if (!open) {
      setUserId('')
    }
  }, [open])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    if (!userId) {
      toast.error('Select a Console user')
      return
    }

    notifyInApp(
      {
        promotionCodeId: promotionCode.id,
        userId,
      },
      {
        onSuccess: () => {
          toast.success('Promotion Code Delivery upserted')
          onOpenChange(false)
        },
        onError: (error) =>
          toast.error(
            getErrorMessage(error, 'Failed to upsert Promotion Code Delivery'),
          ),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>In-app notify</DialogTitle>
            <DialogDescription>
              Upserts an open Promotion Code Delivery for{' '}
              <span className='font-mono'>{promotionCode.code}</span>. Console
              chrome for that delivery is out of scope here.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='promotion-code-notify-user'>Console user</Label>
              <Select
                value={userId || undefined}
                onValueChange={setUserId}
                disabled={usersPending || isPending || !promotionCode.active}
              >
                <SelectTrigger
                  id='promotion-code-notify-user'
                  className='w-full'
                >
                  <SelectValue
                    placeholder={
                      usersPending ? 'Loading users...' : 'Select a user'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.email} ({user.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              variant='primary'
              disabled={isPending || !promotionCode.active || !userId}
            >
              {isPending ? 'Saving...' : 'Notify'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
