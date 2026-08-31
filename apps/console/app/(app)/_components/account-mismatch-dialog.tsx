'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@virtality/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ACCOUNT_MISMATCH_NOTICE_PARAM,
  ACCOUNT_MISMATCH_NOTICE_VALUE,
} from '@/lib/account-mismatch'

const AccountMismatchDialogInner = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const open =
    searchParams.get(ACCOUNT_MISMATCH_NOTICE_PARAM) ===
    ACCOUNT_MISMATCH_NOTICE_VALUE

  const dismiss = () => router.replace('/')

  return (
    <Dialog open={open} onOpenChange={(next) => !next && dismiss()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>That link is for a different account</DialogTitle>
          <DialogDescription>
            The link you followed belongs to another account. Sign out and sign
            back in with that account to use it, or continue here with the
            account you&apos;re currently signed in as.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type='button' variant='primary' onClick={dismiss}>
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const AccountMismatchDialog = () => (
  <Suspense fallback={null}>
    <AccountMismatchDialogInner />
  </Suspense>
)

export default AccountMismatchDialog
