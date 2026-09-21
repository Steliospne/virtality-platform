'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@virtality/ui/components/card'
import { Send } from 'lucide-react'

type AdminEmailFinalSendCardProps = {
  sendReadiness: { ready: boolean; reasons: string[] }
  isPending: boolean
  onOpen: () => void
}

export const AdminEmailFinalSendCard = ({
  sendReadiness,
  isPending,
  onOpen,
}: AdminEmailFinalSendCardProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Final send</CardTitle>
      <CardDescription>
        Immediate and irreversible. Opt-outs are enforced at this step.
      </CardDescription>
    </CardHeader>
    <CardContent className='space-y-3'>
      {!sendReadiness.ready ? (
        <ul className='text-muted-foreground list-disc space-y-1 pl-5 text-sm'>
          {sendReadiness.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : null}
      <Button
        type='button'
        onClick={onOpen}
        disabled={!sendReadiness.ready || isPending}
      >
        <Send className='mr-2 size-4' />
        Final send
      </Button>
    </CardContent>
  </Card>
)
