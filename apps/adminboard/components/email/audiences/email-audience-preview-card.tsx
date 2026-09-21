'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@virtality/ui/components/card'
import { Calculator } from 'lucide-react'

type AudiencePreview = {
  total: number
  fromUsers: number
  fromWaitlist: number
  fromIncludePins: number
  excludedByPins: number
  sample: string[]
}

type EmailAudiencePreviewCardProps = {
  result: AudiencePreview | null
  isPending: boolean
  onEvaluate: () => void
}

/** Evaluates the form as it is now, saved or not. */
export const EmailAudiencePreviewCard = ({
  result,
  isPending,
  onEvaluate,
}: EmailAudiencePreviewCardProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Reach right now</CardTitle>
      <CardDescription>
        Evaluate the rule and pins against live data. Opt-outs are applied per
        draft, not here.
      </CardDescription>
    </CardHeader>
    <CardContent className='space-y-3'>
      <Button
        type='button'
        variant='outline'
        onClick={onEvaluate}
        disabled={isPending}
      >
        <Calculator className='mr-2 size-4' />
        {isPending ? 'Evaluating...' : 'Evaluate'}
      </Button>

      {result ? (
        <div className='space-y-2 text-sm'>
          <p className='text-2xl font-semibold'>
            {result.total}{' '}
            <span className='text-muted-foreground text-sm font-normal'>
              recipient{result.total === 1 ? '' : 's'}
            </span>
          </p>
          <dl className='text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-1 text-xs'>
            <dt>From users</dt>
            <dd className='text-foreground'>{result.fromUsers}</dd>
            <dt>From waitlist</dt>
            <dd className='text-foreground'>{result.fromWaitlist}</dd>
            <dt>Pinned in</dt>
            <dd className='text-foreground'>{result.fromIncludePins}</dd>
            <dt>Pinned out</dt>
            <dd className='text-foreground'>{result.excludedByPins}</dd>
          </dl>
          {result.sample.length > 0 ? (
            <p className='text-muted-foreground truncate text-xs'>
              e.g. {result.sample.slice(0, 3).join(', ')}
              {result.total > 3 ? ', …' : ''}
            </p>
          ) : null}
        </div>
      ) : null}
    </CardContent>
  </Card>
)
