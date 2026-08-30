import Link from 'next/link'
import { Button } from '@virtality/ui/components/button'
import { profileBillingHref } from '@/lib/renew-prompt-dismiss'

export function CheckoutSuccessTimeoutMessage({ userId }: { userId: string }) {
  return (
    <div className='space-y-2 text-sm'>
      <p className='text-muted-foreground'>
        Access is taking longer than expected. Check Profile Billing for status.
      </p>
      <Button asChild variant='outline' size='sm'>
        <Link href={profileBillingHref(userId)}>Open Profile Billing</Link>
      </Button>
    </div>
  )
}
