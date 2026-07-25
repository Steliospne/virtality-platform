'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@virtality/ui/components/button'
import { getDemoBookingUrl } from '@/lib/demo-booking'
import { HERO_PRIMARY_CTA_LABEL, HERO_SECONDARY_CTA_LABEL } from '../content'
import { scrollToFinalCta } from '@/lib/scroll-to-cta'
import HeroTitle from './hero-title'

const demoBookingUrl = getDemoBookingUrl()

const HERO_VIDEO_SRC_MOBILE = '/hero/ManNeuralFlipped-loop-zoomed-out.mp4'
const HERO_VIDEO_POSTER_MOBILE = '/hero/ManNeuralFlipped-poster-zoomed-out.jpg'
const HERO_VIDEO_SRC_DESKTOP = '/hero/ManNeuralFlipped-loop.mp4'
const HERO_VIDEO_POSTER_DESKTOP = '/hero/ManNeuralFlipped-poster.jpg'
const HERO_VIDEO_ALT =
  'Patient wearing a VR headset during a guided therapy session with neural motion overlay'

/**
 * Full-bleed looped video backdrop take with CTAs at the center bottom.
 * Mobile uses a zoomed-out master (subject scaled to 65% with studio-gray pad)
 * so object-cover crops less aggressively; desktop keeps the original framing.
 */
const HeroVideoBackdropCtaCenter = () => {
  const mobileVideoRef = useRef<HTMLVideoElement>(null)
  const desktopVideoRef = useRef<HTMLVideoElement>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncReducedMotion = () => {
      setPrefersReducedMotion(mediaQuery.matches)
    }

    syncReducedMotion()
    mediaQuery.addEventListener('change', syncReducedMotion)

    return () => {
      mediaQuery.removeEventListener('change', syncReducedMotion)
    }
  }, [])

  useEffect(() => {
    const videos = [mobileVideoRef.current, desktopVideoRef.current]

    for (const video of videos) {
      if (!video) continue

      if (prefersReducedMotion) {
        video.pause()
        continue
      }

      void video.play().catch(() => {
        video.pause()
      })
    }
  }, [prefersReducedMotion])

  return (
    <section className='min-h-screen-with-nav relative flex flex-col overflow-hidden bg-[#CAD6D6] sm:bg-[#fbfaf7] dark:bg-zinc-900'>
      {/* Full-bleed backdrop video */}
      <div className='absolute inset-0'>
        {/* Mobile media + wash */}
        <div className='absolute inset-0 sm:hidden'>
          {prefersReducedMotion ? (
            <Image
              src={HERO_VIDEO_POSTER_MOBILE}
              alt={HERO_VIDEO_ALT}
              fill
              priority
              sizes='100vw'
              className='object-cover object-[62%_center]'
            />
          ) : (
            <video
              ref={mobileVideoRef}
              aria-label={HERO_VIDEO_ALT}
              className='absolute inset-0 size-full object-cover object-[62%_center]'
              poster={HERO_VIDEO_POSTER_MOBILE}
              muted
              playsInline
              loop
              autoPlay
              preload='auto'
            >
              <source src={HERO_VIDEO_SRC_MOBILE} type='video/mp4' />
            </video>
          )}

          {/* Steep left wash for copy; subject stays clear on the right */}
          <div className='absolute inset-0 bg-linear-to-r from-[#CAD6D6] from-0% via-[#CAD6D6]/88 via-40% to-transparent to-70% dark:from-zinc-900 dark:via-zinc-900/88' />
          <div className='absolute inset-0 bg-linear-to-b from-[#CAD6D6]/50 from-0% via-transparent via-28% to-transparent dark:from-zinc-900/50' />
        </div>

        {/* Desktop media + wash */}
        <div className='absolute inset-0 hidden sm:block'>
          {prefersReducedMotion ? (
            <Image
              src={HERO_VIDEO_POSTER_DESKTOP}
              alt={HERO_VIDEO_ALT}
              fill
              priority
              sizes='100vw'
              className='object-cover object-[52%_center] md:object-[60%_center] lg:object-[68%_center]'
            />
          ) : (
            <video
              ref={desktopVideoRef}
              aria-label={HERO_VIDEO_ALT}
              className='absolute inset-0 size-full object-cover object-[52%_center] md:object-[60%_center] lg:object-[68%_center]'
              poster={HERO_VIDEO_POSTER_DESKTOP}
              muted
              playsInline
              loop
              autoPlay
              preload='auto'
            >
              <source src={HERO_VIDEO_SRC_DESKTOP} type='video/mp4' />
            </video>
          )}

          {/* Light wash where the copy sits, image breathes toward the right */}
          <div className='absolute inset-0 bg-linear-to-r from-[#fbfaf7] via-[#fbfaf7]/88 to-[#fbfaf7]/20 md:via-[#fbfaf7]/82 md:to-[#fbfaf7]/10 lg:via-[#fbfaf7]/65 lg:to-transparent dark:from-zinc-900 dark:via-zinc-900/88 dark:to-zinc-900/15' />
        </div>

        {/* Bottom fade into the white page below */}
        <div className='absolute inset-0 bg-linear-to-t from-white from-8% via-transparent via-40% to-transparent sm:from-15% dark:from-zinc-900' />
      </div>

      {/* Grain */}
      <div
        className='pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-multiply dark:opacity-[0.06] dark:mix-blend-overlay'
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Title — vertically centered like desktop */}
      <div className='relative z-1 container m-auto flex flex-1 flex-col justify-center px-4 py-16 pb-28 md:px-8 md:py-20 md:pb-32'>
        <div className='w-full max-w-[21rem] sm:max-w-xl'>
          <HeroTitle align='left' badge='logo' showCtas={false} />
        </div>
      </div>

      {/* CTAs — center bottom of the hero */}
      <div className='pointer-events-none absolute inset-x-0 bottom-8 z-10 flex justify-center px-4 md:bottom-12'>
        <div className='pointer-events-auto flex flex-col items-center gap-4 sm:flex-row sm:gap-5'>
          <Button
            variant='primary'
            className='h-auto rounded-full px-7 py-4 text-base font-semibold shadow-lg shadow-vital-blue-700/25 transition-all hover:shadow-xl hover:shadow-vital-blue-700/30'
            onClick={scrollToFinalCta}
          >
            <span className='flex items-center gap-2'>
              {HERO_PRIMARY_CTA_LABEL}
              <ArrowRight className='size-4' />
            </span>
          </Button>

          <Button
            asChild
            variant='ghost'
            className='h-auto rounded-full px-4 py-4 text-base font-semibold text-slate-700 underline-offset-4 hover:text-vital-blue-700 hover:underline dark:text-gray-200'
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
      </div>
    </section>
  )
}

export default HeroVideoBackdropCtaCenter
