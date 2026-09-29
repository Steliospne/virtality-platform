'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, Zap } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@virtality/ui/components/collapsible'
import { Button } from '@virtality/ui/components/button'
import { cn } from '@/lib/utils'
import {
  gettingStartedHeadline,
  gettingStartedSubline,
  START_SESSION_ANCHOR,
  type GettingStarted,
} from '@/lib/home-getting-started'
import HomeSectionLabel from './home-section-label'
import GettingStartedRing from './getting-started-ring'
import GettingStartedStep from './getting-started-step'

/**
 * Open while steps remain; once they are all done it stays on the dashboard
 * collapsed to its summary row, which the clinician can expand again.
 */
const GettingStartedCard = ({
  gettingStarted,
}: {
  gettingStarted: GettingStarted
}) => {
  const [open, setOpen] = useState(!gettingStarted.complete)

  // Completing the last step collapses the card; a new gap reopens it.
  useEffect(() => {
    setOpen(!gettingStarted.complete)
  }, [gettingStarted.complete])

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className='bg-card text-card-foreground flex flex-col overflow-hidden rounded-xl border shadow-sm'
    >
      <div className='bg-sidebar grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-6 py-5'>
        <GettingStartedRing
          done={gettingStarted.doneCount}
          total={gettingStarted.steps.length}
        />
        <div>
          <HomeSectionLabel>Getting started</HomeSectionLabel>
          <p className='mt-1 text-lg leading-6 font-semibold text-balance'>
            {gettingStartedHeadline(gettingStarted)}
          </p>
          <p className='text-muted-foreground mt-1.5 text-[13px]'>
            {gettingStartedSubline(gettingStarted)}
          </p>
        </div>
        <CollapsibleTrigger asChild>
          <Button variant='ghost' size='sm'>
            {open ? 'Hide steps' : 'Show steps'}
            <ChevronDown
              className={cn('transition-transform', open && 'rotate-180')}
            />
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className='border-t'>
        <ol className='flex flex-col'>
          {gettingStarted.steps.map((step, index) => (
            <GettingStartedStep key={step.id} step={step} number={index + 1} />
          ))}
        </ol>
        <div className='flex items-center gap-3 border-t px-6 py-3'>
          <span className='text-muted-foreground text-[13px]'>In a hurry?</span>
          <Button asChild variant='outline' size='sm'>
            <Link href={`#${START_SESSION_ANCHOR}`}>
              <Zap /> Quick Start skips the program step
            </Link>
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export default GettingStartedCard
