'use client'

import Link from 'next/link'
import { Zap } from 'lucide-react'
import { Button } from '@virtality/ui/components/button'
import {
  gettingStartedHeadline,
  START_SESSION_ANCHOR,
  type GettingStarted,
} from '@/lib/home-getting-started'
import HomeSectionLabel from './home-section-label'
import GettingStartedRing from './getting-started-ring'
import GettingStartedStep from './getting-started-step'

/** Folds away on its own once every step is done. */
const GettingStartedCard = ({
  gettingStarted,
}: {
  gettingStarted: GettingStarted
}) => {
  if (gettingStarted.complete) return null

  return (
    <section className='bg-card text-card-foreground flex flex-col overflow-hidden rounded-xl border shadow-sm'>
      <div className='bg-sidebar grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 border-b px-6 py-5'>
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
            Once these are done this card folds away.
          </p>
        </div>
      </div>
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
    </section>
  )
}

export default GettingStartedCard
