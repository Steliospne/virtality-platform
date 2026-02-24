'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ReactNode, useState } from 'react'

interface DeleteConfirmDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onConfirm: () => void
  children?: ReactNode
  asChild?: boolean
  title: string | ReactNode
  description: string | ReactNode
}

const DeleteConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
  children,
  asChild,
  title,
  description,
}: DeleteConfirmDialogProps) => {
  const [_open, _setOpen] = useState(false)

  const handleConfirm = () => {
    onConfirm()
    if (onOpenChange) return onOpenChange(false)
    _setOpen(false)
  }

  const cancelHandler = () => {
    if (onOpenChange) return onOpenChange(false)
    _setOpen(false)
  }

  return (
    <Dialog
      open={open ? open : _open}
      onOpenChange={onOpenChange ? onOpenChange : _setOpen}
    >
      <DialogTrigger asChild={asChild}>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant='outline' onClick={cancelHandler}>
            Cancel
          </Button>
          <Button variant='destructive' onClick={handleConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteConfirmDialog
