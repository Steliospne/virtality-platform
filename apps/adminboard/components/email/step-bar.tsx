'use client'

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

export type DraftStep = 'compose' | 'target' | 'review'

const STEPS: { id: DraftStep; label: string }[] = [
  { id: 'compose', label: 'Compose' },
  { id: 'target', label: 'Target' },
  { id: 'review', label: 'Review & send' },
]

type StepBarProps = {
  current: DraftStep
  onSelect: (step: DraftStep) => void
  blockCount: number
  sendReady: boolean
}

export const StepBar = ({
  current,
  onSelect,
  blockCount,
  sendReady,
}: StepBarProps) => {
  const currentIndex = STEPS.findIndex((step) => step.id === current)

  return (
    <div className='bg-card flex overflow-hidden rounded-lg border'>
      {STEPS.map((step, index) => {
        const isCurrent = step.id === current
        const isDone = index < currentIndex
        const meta =
          step.id === 'compose'
            ? `${blockCount} block${blockCount === 1 ? '' : 's'}`
            : step.id === 'review'
              ? sendReady
                ? 'ready'
                : 'not ready'
              : null

        return (
          <button
            key={step.id}
            type='button'
            onClick={() => onSelect(step.id)}
            className={cn(
              'hover:bg-accent/60 flex flex-1 items-center gap-2.5 border-r px-4 py-2.5 text-left text-sm transition-colors last:border-r-0',
              isCurrent ? 'bg-accent font-medium' : 'text-muted-foreground',
            )}
          >
            <span
              className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-full border font-mono text-[11px]',
                isCurrent &&
                  'bg-primary text-primary-foreground border-transparent',
                isDone &&
                  'border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
              )}
            >
              {isDone ? <Check className='size-3' /> : index + 1}
            </span>
            <span>{step.label}</span>
            {meta ? (
              <span className='text-muted-foreground text-xs font-normal'>
                · {meta}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
