import Link from 'next/link'
import { Button } from '@virtality/ui/components/button'

export function CheckoutSuccessHomeCta({ enabled }: { enabled: boolean }) {
  if (!enabled) {
    return (
      <Button size='lg' disabled>
        Back to Console
      </Button>
    )
  }

  return (
    <Button asChild size='lg'>
      <Link href='/'>Back to Console</Link>
    </Button>
  )
}
