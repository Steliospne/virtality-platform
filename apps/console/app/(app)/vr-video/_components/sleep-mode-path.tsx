import { ChevronRight } from 'lucide-react'
import { Fragment } from 'react'
import { MetaButtonIcon } from './meta-button-icon'

const steps = [
  'Open Settings',
  'General',
  'Power',
  'From the Sleep mode dropdown, select 4 hours',
]

export function SleepModePath() {
  return (
    <div className='text-muted-foreground mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm'>
      <span className='text-foreground inline-flex items-center gap-1.5'>
        Press the <MetaButtonIcon /> button
      </span>
      {steps.map((step) => (
        <Fragment key={step}>
          <ChevronRight className='size-4 shrink-0' aria-hidden='true' />
          <span className='text-foreground'>{step}</span>
        </Fragment>
      ))}
    </div>
  )
}
