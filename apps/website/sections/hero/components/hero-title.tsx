'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@virtality/ui/components/button'
import { ArrowRight, Activity } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Fraunces } from 'next/font/google'
import { getDemoBookingUrl } from '@/lib/demo-booking'
import {
  HERO_BADGE_LABEL,
  HERO_HEADLINE,
  HERO_PRIMARY_CTA_LABEL,
  HERO_SECONDARY_CTA_LABEL,
  HERO_SUPPORTING_COPY,
} from '../content'
import { scrollToFinalCta } from '@/lib/scroll-to-cta'
import { splitText } from '@/lib/utils'
import { animate, stagger } from 'motion/react'

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['500', '600'],
  style: ['normal', 'italic'],
})

const demoBookingUrl = getDemoBookingUrl()

type HeroTitleProps = {
  align?: 'center' | 'left'
  badge?: 'label' | 'logo'
  /** Hide the supporting sentence under the headline. */
  showSupportingCopy?: boolean
  /** Hide the CTA row (e.g. when CTAs are placed elsewhere in the hero). */
  showCtas?: boolean
  /** Enlarge logo + headline (~1.5×) for the scaled backdrop take. */
  emphasis?: 'default' | 'large'
}

const HeroTitle = ({
  align = 'center',
  badge = 'label',
  showSupportingCopy = true,
  showCtas = true,
  emphasis = 'default',
}: HeroTitleProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const isLeftAligned = align === 'left'
  const isLarge = emphasis === 'large'

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    document.fonts.ready.then(() => {
      if (!containerRef.current) return

      containerRef.current.style.visibility = 'visible'

      if (prefersReducedMotion) return

      const { words, chars } = splitText(
        containerRef.current.querySelector('h1')!,
        {
          wordClass: 'split-word',
          charClass: 'split-char',
          preserveWhitespace: true,
        },
      )
      animate(
        words,
        { opacity: [0, 1], y: [24, 0] },
        {
          type: 'spring',
          duration: 1.4,
          bounce: 0,
          delay: stagger(0.05),
        },
      )
      animate(
        chars,
        { opacity: [0, 1] },
        {
          duration: 0.4,
          delay: stagger(0.008),
        },
      )
    })
  }, [])

  return (
    <div
      ref={containerRef}
      className={`flex flex-col ${isLarge ? 'gap-5' : 'gap-5 sm:gap-7'} ${
        isLeftAligned ? 'items-start text-left' : 'items-center text-center'
      }`}
    >
      {badge === 'logo' ? (
        <Image
          src='/virtality_cyan.png'
          alt='Virtality'
          width={273}
          height={28}
          priority
          sizes='(min-width: 640px) 312px, 273px'
          className={
            isLarge
              ? 'h-10.5! w-auto! max-w-none sm:h-12!'
              : 'h-4! w-auto! max-w-none sm:h-5!'
          }
        />
      ) : (
        <div className='inline-flex items-center gap-2 rounded-full border border-vital-blue-700/25 bg-white/70 px-4 py-1.5 text-[11px] font-semibold tracking-[0.22em] text-vital-blue-800 uppercase shadow-sm shadow-vital-blue-900/5 backdrop-blur-sm dark:bg-white/10 dark:text-vital-blue-200'>
          <Activity className='size-3.5' />
          <span>{HERO_BADGE_LABEL}</span>
        </div>
      )}

      <h1
        className={`${fraunces.className} max-w-4xl leading-[1.02] font-medium tracking-tight text-slate-900 dark:text-white [&_.split-word:last-child]:text-vital-blue-700 [&_.split-word:last-child]:italic dark:[&_.split-word:last-child]:text-vital-blue-300 ${
          isLarge
            ? 'text-[4.125rem] sm:text-[5.625rem] md:text-[7.125rem]'
            : 'text-[2.75rem] sm:text-6xl md:text-[4.75rem]'
        }`}
      >
        {HERO_HEADLINE}
      </h1>

      {showSupportingCopy ? (
        <p
          className={`text-base leading-relaxed text-slate-700 sm:text-lg md:text-xl dark:text-gray-300 ${
            isLeftAligned ? 'max-w-md' : 'max-w-lg'
          }`}
        >
          {HERO_SUPPORTING_COPY}
        </p>
      ) : null}

      {showCtas ? (
        <div
          className={`flex flex-col gap-5 sm:flex-row ${
            showSupportingCopy ? 'pt-3' : 'pt-1'
          } ${isLeftAligned ? 'items-start' : 'items-center'}`}
        >
          <Button
            variant='primary'
            className='h-auto rounded-full px-7 py-4 text-base font-semibold shadow-lg shadow-vital-blue-700/25 transition-all hover:shadow-xl hover:shadow-vital-blue-700/30'
            onClick={scrollToFinalCta}
          >
            <span className='flex items-center gap-2'>
              {HERO_PRIMARY_CTA_LABEL}
              <ArrowRight className='size-4 transition-transform group-hover:translate-x-1' />
            </span>
          </Button>

          <Button
            asChild
            variant='ghost'
            className='h-auto rounded-full px-2 py-4 text-base font-semibold text-slate-700 underline-offset-4 hover:text-vital-blue-700 hover:underline dark:text-gray-200'
          >
            <Link
              href={demoBookingUrl}
              target='_blank'
              rel='noopener noreferrer'
            >
              {HERO_SECONDARY_CTA_LABEL}
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export default HeroTitle
