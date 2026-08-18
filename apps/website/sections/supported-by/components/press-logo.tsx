import CredibilityLogo from './credibility-logo'
import { type PressLogoItem } from '../content'
import { getPressLinkProps } from '../lib/partner-press'

function getPressLogoHeightClass(item: PressLogoItem): string {
  if (item.wide) {
    // Wordmarks share one height; width follows the asset aspect ratio.
    // Slightly under the old letterboxed box so intrinsic sizing matches prior visual weight.
    return 'h-4 md:h-6'
  }

  // Square marks need more height to match wordmark visual weight.
  return 'h-12 md:h-14'
}

function PressLogo({ item }: { item: PressLogoItem }) {
  const logo = (
    <CredibilityLogo
      item={item}
      size='secondary'
      className={getPressLogoHeightClass(item)}
    />
  )
  const href = item.href?.trim()

  if (!href) {
    return <div className='inline-flex shrink-0'>{logo}</div>
  }

  return (
    <a
      href={href}
      {...getPressLinkProps(href)}
      className='inline-flex shrink-0'
      draggable={false}
    >
      {logo}
    </a>
  )
}

export default PressLogo
