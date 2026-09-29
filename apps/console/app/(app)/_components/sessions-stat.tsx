import { cn } from '@/lib/utils'

const SessionsStat = ({
  label,
  value,
  className,
}: {
  label: string
  value: React.ReactNode
  className?: string
}) => (
  <div className='flex flex-col text-[13px]'>
    <span className='text-muted-foreground'>{label}</span>
    <b
      className={cn(
        'text-lg leading-tight font-semibold tabular-nums',
        className,
      )}
    >
      {value}
    </b>
  </div>
)

export default SessionsStat
