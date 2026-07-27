import Image from 'next/image'
import type { CredibilityLogoItem } from '../content'
import { cn } from '@/lib/utils'

type CredibilityLogoProps = {
  item: CredibilityLogoItem
  size?: 'primary' | 'secondary'
  className?: string
}

function getCredibilityLogoDimensions(
  size: 'primary' | 'secondary',
  item: CredibilityLogoItem,
): string {
  if (size === 'primary') {
    return 'w-56 h-20'
  }

  if (item.wide) {
    return 'w-44 h-12 sm:w-56 sm:h-14'
  }

  if (item.compact) {
    return 'w-20 h-12 sm:w-24 sm:h-14'
  }

  return 'w-32 h-12 sm:w-40 sm:h-14'
}

/** Partner logos at full opacity with brand colours. */
const CredibilityLogo = ({
  item,
  size = 'primary',
  className,
}: CredibilityLogoProps) => {
  const dimensions = getCredibilityLogoDimensions(size, item)

  return (
    <div
      className={cn(
        'group relative flex flex-col items-center gap-4 opacity-100',
        dimensions,
        className,
      )}
    >
      <div className={cn('relative h-full w-full', item.className)}>
        <Image
          src={item.src}
          alt={item.alt}
          fill
          className={cn('absolute object-contain grayscale-0', item.className)}
        />
      </div>
      {size === 'primary' ? (
        <div className='w-2/3 h-0.5 rounded-full bg-linear-to-r from-transparent via-vital-blue-400 to-transparent opacity-0 group-hover:opacity-70 transition-opacity duration-300' />
      ) : null}
    </div>
  )
}

export default CredibilityLogo
