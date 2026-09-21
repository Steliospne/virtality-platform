import Image from 'next/image'
import { shouldBypassVercelImageOptimization } from '@virtality/shared/utils'
import { cn } from '@/lib/utils'

export function patientInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

const PatientInitialsAvatar = ({
  name,
  image,
  className,
}: {
  name: string
  image?: string | null
  className?: string
}) => {
  return (
    <span
      className={cn(
        'bg-muted text-foreground relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-full text-xs font-semibold',
        className,
      )}
      aria-hidden
    >
      {image ? (
        <Image
          src={image}
          alt=''
          fill
          sizes='40px'
          className='object-cover'
          unoptimized={shouldBypassVercelImageOptimization(image)}
        />
      ) : (
        patientInitials(name)
      )}
    </span>
  )
}

export default PatientInitialsAvatar
