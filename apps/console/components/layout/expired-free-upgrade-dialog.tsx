'use client'

import Link from 'next/link'
import { CreditCard } from 'lucide-react'
import { Button } from '@virtality/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useExpiredFreeUpgradePrompt } from '@/hooks/use-expired-free-upgrade-prompt'
import { profileBillingHref } from '@/lib/renew-prompt-dismiss'

/**
 * Dismissible upgrade dialog for clinicians on expired Free or canceled seats.
 * Deep-links to Profile Billing and does not block non-launch Console use.
 */
export function ExpiredFreeUpgradeDialog() {
  const { open, dismiss, userId } = useExpiredFreeUpgradePrompt()

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) dismiss()
      }}
    >
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Upgrade to launch VR programs</DialogTitle>
          <DialogDescription>
            Your Pro access has ended. Subscribe to Pro to start VR programs
            again. You can keep browsing Console while you decide.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type='button' variant='outline' onClick={dismiss}>
            Not now
          </Button>
          {userId && (
            <Button asChild variant='primary'>
              <Link href={profileBillingHref(userId)} onClick={dismiss}>
                <CreditCard />
                View billing plans
              </Link>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
