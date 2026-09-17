'use client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@virtality/ui/components/button'

export interface NavigationGuardDialogProps {
  open: boolean
  onStay: () => void
  onLeave: () => void
  title: string
  description: string
}

/**
 * Stay/Leave confirmation shown by `useNavigationGuard`. Declared at module
 * level so its identity is stable across parent renders; defining it inside
 * the hook remounted the dialog on every render and made it flicker.
 */
export function NavigationGuardDialog({
  open,
  onStay,
  onLeave,
  title,
  description,
}: NavigationGuardDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => (o ? undefined : onStay())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant='destructive' onClick={onLeave}>
            Leave
          </Button>
          <Button variant='primary' onClick={onStay}>
            Stay
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
