import Link from 'next/link'
import { Check } from 'lucide-react'
import { Button } from '@virtality/ui/components/button'
import { cn } from '@/lib/utils'
import type { GettingStartedStep as Step } from '@/lib/home-getting-started'

const actionLabel: Record<Step['id'], { open: string; done: string }> = {
  device: { open: 'Pair', done: 'Add another' },
  patient: { open: 'Add patient', done: 'Open' },
  program: { open: 'Create program', done: 'Open' },
  session: { open: 'Start', done: 'Open' },
}

const GettingStartedStep = ({
  step,
  number,
}: {
  step: Step
  number: number
}) => (
  <li
    className={cn(
      'grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3.5 border-t px-6 py-3.5 first:border-t-0',
      step.current && 'bg-vital-blue-50 dark:bg-vital-blue-500/10',
    )}
  >
    <span
      className={cn(
        'grid size-7 place-items-center rounded-full border text-xs font-semibold',
        step.done &&
          'border-green-700 bg-green-700 text-white dark:border-green-500 dark:bg-green-500 dark:text-zinc-950',
        step.current &&
          'border-vital-blue-700 text-vital-blue-700 dark:border-vital-blue-400 dark:text-vital-blue-400',
      )}
      aria-hidden
    >
      {step.done ? <Check className='size-4' strokeWidth={2.5} /> : number}
    </span>
    <div className='min-w-0'>
      <div
        className={cn(
          'font-medium',
          step.done && 'text-muted-foreground line-through',
        )}
      >
        {step.title}
      </div>
      <div className='text-muted-foreground text-[13px]'>{step.detail}</div>
    </div>
    <Button
      asChild
      size='sm'
      variant={step.current ? 'primary' : step.done ? 'ghost' : 'outline'}
    >
      <Link href={step.href}>
        {step.done ? actionLabel[step.id].done : actionLabel[step.id].open}
      </Link>
    </Button>
  </li>
)

export default GettingStartedStep
