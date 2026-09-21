import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import HomeSectionLabel from './home-section-label'

/** Column frame for one step of the picker: label, done marker, options, footer link. */
const StartSessionStep = ({
  number,
  label,
  done,
  children,
  footer,
}: {
  number: number
  label: string
  done: boolean
  children: React.ReactNode
  footer?: React.ReactNode
}) => (
  <div
    role='listbox'
    aria-label={label}
    className={cn(
      'bg-card flex min-h-62 flex-col gap-3 rounded-xl border p-4 transition-shadow',
      done &&
        'border-vital-blue-700 ring-vital-blue-100 dark:border-vital-blue-500 dark:ring-vital-blue-500/30 ring-3',
    )}
  >
    <div className='flex items-center justify-between'>
      <HomeSectionLabel>{label}</HomeSectionLabel>
      <span
        className={cn(
          'grid size-5.5 place-items-center rounded-full border text-xs font-semibold',
          done &&
            'border-vital-blue-700 bg-vital-blue-700 dark:border-vital-blue-500 dark:bg-vital-blue-500 text-white dark:text-zinc-950',
        )}
        aria-hidden
      >
        {done ? <Check className='size-3.5' strokeWidth={2.5} /> : number}
      </span>
    </div>
    {children}
    {footer ? <div className='mt-auto pt-1'>{footer}</div> : null}
  </div>
)

export default StartSessionStep
