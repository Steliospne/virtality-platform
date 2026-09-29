import { cn } from '@/lib/utils'

const HomeSectionLabel = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => (
  <span
    className={cn(
      'text-muted-foreground text-xs font-semibold tracking-[0.06em] uppercase',
      className,
    )}
  >
    {children}
  </span>
)

export default HomeSectionLabel
