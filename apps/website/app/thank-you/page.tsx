'use client'

import Link from 'next/link'
import { Card, CardContent } from '@virtality/ui/components/card'
import { Button } from '@virtality/ui/components/button'
import { ArrowRight, CalendarCheck, Check, Gift, Sparkles } from 'lucide-react'
import { animate } from 'motion/react'
import { useEffect, useRef } from 'react'

const ThankYouPage = () => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const children = containerRef.current.querySelectorAll(
      '[data-thank-you-item]',
    )

    // Stagger the rest of the content
    animate(
      children,
      { opacity: [0, 1], y: [24, 0] },
      {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        delay: (index) => 0.35 + index * 0.12,
      },
    )
  }, [])

  return (
    <section className='flex min-h-screen flex-col items-center justify-center bg-linear-to-br from-slate-50 to-teal-50 px-4 py-16'>
      <div
        className='pointer-events-none absolute inset-0 opacity-[0.02]'
        style={{
          backgroundImage: `
            linear-gradient(to right, #08899a 1px, transparent 1px),
            linear-gradient(to bottom, #08899a 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      {/* Soft orbs */}
      <div
        className='bg-vital-blue-400/10 pointer-events-none absolute top-1/4 right-0 h-100 w-100 rounded-full blur-3xl'
        style={{ animation: 'pulse 5s ease-in-out infinite' }}
      />
      <div
        className='bg-vital-blue-600/8 pointer-events-none absolute bottom-1/4 left-0 h-87.5 w-87.5 rounded-full blur-3xl'
        style={{ animation: 'pulse 6s ease-in-out infinite 0.5s' }}
      />

      <div
        className='relative z-10 mx-auto w-full max-w-2xl'
        ref={containerRef}
      >
        <Card className='overflow-hidden border-0 bg-white/90 shadow-xl backdrop-blur-sm'>
          {/* Accent bar – same as CTA */}
          <div className='from-vital-blue-700 via-vital-blue-600 to-vital-blue-700 h-2 bg-linear-to-r' />

          <CardContent className='p-8 text-center md:p-12'>
            {/* Success icon */}
            <div
              data-thank-you-item
              className='from-vital-blue-700 to-vital-blue-600 shadow-vital-blue-600/25 mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-r shadow-lg'
              aria-hidden
            >
              <Check className='size-10 text-white' />
            </div>

            <h1
              data-thank-you-item
              className='mb-3 text-3xl font-bold text-slate-800 md:text-4xl'
            >
              You&apos;re all set! Welcome to Virtality. 🚀
            </h1>
            <p
              data-thank-you-item
              className='mx-auto mb-8 max-w-[45ch] text-lg text-slate-600'
            >
              We just sent an email to your inbox with everything you need to
              get started.
            </p>

            {/* What's next */}
            <div
              data-thank-you-item
              className='mb-8 grid gap-4 text-left sm:grid-cols-2'
            >
              <div className='border-vital-blue-100/60 flex items-center gap-3 rounded-xl border bg-slate-50/80 p-4'>
                <div className='bg-vital-blue-100 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg'>
                  <CalendarCheck className='text-vital-blue-700 size-5' />
                </div>
                <p className='text-sm font-semibold text-slate-800'>
                  Book your 1-on-1 onboarding session to get instant access.
                </p>
              </div>
              <div className='border-vital-blue-100/60 flex items-center gap-3 rounded-xl border bg-slate-50/80 p-4'>
                <div className='bg-vital-blue-100 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg'>
                  <Gift className='text-vital-blue-700 size-5' />
                </div>
                <p className='text-sm font-semibold text-slate-800'>
                  As an early member, you&apos;ll receive special pricing and
                  personalized support.
                </p>
              </div>
            </div>

            <p
              data-thank-you-item
              className='mb-6 flex items-center justify-center gap-2 text-sm text-slate-500'
            >
              <Sparkles className='text-vital-blue-500 size-4' aria-hidden />
              Because every move matters.
            </p>

            <div data-thank-you-item>
              <Button
                asChild
                className='bg-vital-blue-700 hover:bg-vital-blue-800 shadow-vital-blue-700/25 hover:shadow-vital-blue-700/30 group h-12 rounded-xl px-6 text-base font-semibold shadow-lg transition-all hover:shadow-xl'
              >
                <Link
                  href='/'
                  className='group/link inline-flex items-center gap-2'
                >
                  Back to home
                  <ArrowRight className='size-4 transition-transform group-hover/link:translate-x-1' />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

export default ThankYouPage
