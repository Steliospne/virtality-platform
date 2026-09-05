import type { CredibilityLogoItem } from '../content'
import { cn } from '@/lib/utils'

type CredibilityLogoProps = {
  item: CredibilityLogoItem
  size?: 'primary' | 'secondary'
  /** Merged onto the image (use for height overrides). */
  className?: string
}

/** Height-only; width follows the logo’s intrinsic aspect ratio (no letterboxing). */
function getCredibilityLogoHeight(
  size: 'primary' | 'secondary',
  item: CredibilityLogoItem,
): string {
  if (size === 'primary') {
    return 'h-12 sm:h-14'
  }

  if (item.wide || item.compact) {
    return 'h-10 sm:h-12'
  }

  return 'h-12 sm:h-14'
}

/**
 * Partner logos at full opacity with brand colours.
 * Plain img so the browser uses the file’s real aspect ratio; next/image
 * width/height attrs were forcing a wrong box and letterboxing height.
 */
const CredibilityLogo = ({
  item,
  size = 'primary',
  className,
}: CredibilityLogoProps) => {
  return (
    <div className='group relative inline-flex flex-col items-center'>
      {/* Logos are tiny local/CDN assets; intrinsic sizing matters more than optimizer. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.src}
        alt={item.alt}
        className={cn(
          'block w-auto max-w-none grayscale-0',
          getCredibilityLogoHeight(size, item),
          className,
          item.className,
        )}
      />
      {size === 'primary' ? (
        <div className='via-vital-blue-400 pointer-events-none absolute inset-x-0 -bottom-2 mx-auto h-0.5 w-2/3 rounded-full bg-linear-to-r from-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-70' />
      ) : null}
    </div>
  )
}

export default CredibilityLogo
