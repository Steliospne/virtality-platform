import Image from 'next/image'
import { CREDIBILITY_LOGO_HOVER_CLASS } from '../lib/partner-press'
import type { CredibilityLogoItem } from '../content'
import type { SupportedByLogoTone } from '../prototype/logo-style-variants'
import { cn } from '@/lib/utils'

type CredibilityLogoProps = {
  item: CredibilityLogoItem
  size?: 'primary' | 'secondary'
  className?: string
  /** PROTOTYPE — full-opacity logo colour treatments */
  tone?: SupportedByLogoTone
}

function logoToneClasses(tone?: SupportedByLogoTone) {
  if (tone === 'greyscale-full') {
    return {
      wrapper: 'opacity-100 hover:opacity-100',
      image: 'grayscale',
    }
  }

  if (tone === 'brand-full') {
    return {
      wrapper: 'opacity-100 hover:opacity-100',
      image: 'grayscale-0',
    }
  }

  return {
    wrapper: undefined,
    image: undefined,
  }
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

const CredibilityLogo = ({
  item,
  size = 'primary',
  className,
  tone,
}: CredibilityLogoProps) => {
  const dimensions = getCredibilityLogoDimensions(size, item)
  const toneClasses = logoToneClasses(tone)

  return (
    <div
      className={cn(
        'group relative flex flex-col items-center gap-4',
        CREDIBILITY_LOGO_HOVER_CLASS,
        toneClasses.wrapper,
        dimensions,
        className,
      )}
    >
      <div className={cn('relative h-full w-full', item.className)}>
        <Image
          src={item.src}
          alt={item.alt}
          fill
          className={cn(
            'absolute object-contain',
            toneClasses.image,
            item.className,
          )}
        />
      </div>
      {size === 'primary' ? (
        <div className='w-2/3 h-0.5 rounded-full bg-linear-to-r from-transparent via-vital-blue-400 to-transparent opacity-0 group-hover:opacity-70 transition-opacity duration-300' />
      ) : null}
    </div>
  )
}

export default CredibilityLogo
