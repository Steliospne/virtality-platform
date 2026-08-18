'use client'

import CredibilitySectionHeader from './credibility-section-header'
import { PRESS_LOGO_ITEMS, PRESS_SECTION_CONTENT } from '../content'
import { filterValidLogoItems } from '../lib/partner-press'
import PressMarquee from './press-marquee'
import { cn } from '@/lib/utils'

type PressLogosProps = {
  className?: string
}

const PressLogos = ({ className }: PressLogosProps) => {
  const pressItems = filterValidLogoItems(PRESS_LOGO_ITEMS)

  if (pressItems.length === 0) {
    return null
  }

  return (
    <div className={cn(className)}>
      <CredibilitySectionHeader content={PRESS_SECTION_CONTENT} />
      <PressMarquee items={pressItems} />
    </div>
  )
}

export default PressLogos
