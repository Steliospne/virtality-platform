'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles, Mail, Gift, Check } from 'lucide-react'
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
    <section className='min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-slate-50 to-teal-50 px-4 py-16'>
      <div
        className='absolute inset-0 opacity-[0.02] pointer-events-none'
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
        className='absolute top-1/4 right-0 w-[400px] h-[400px] rounded-full bg-vital-blue-400/10 blur-3xl pointer-events-none'
        style={{ animation: 'pulse 5s ease-in-out infinite' }}
      />
      <div
        className='absolute bottom-1/4 left-0 w-[350px] h-[350px] rounded-full bg-vital-blue-600/8 blur-3xl pointer-events-none'
        style={{ animation: 'pulse 6s ease-in-out infinite 0.5s' }}
      />

      <div
        className='relative z-10 w-full max-w-2xl mx-auto'
        ref={containerRef}
      >
        <Card className='border-0 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden'>
          {/* Accent bar – same as CTA */}
          <div className='h-2 bg-linear-to-r from-vital-blue-700 via-vital-blue-600 to-vital-blue-700' />

          <CardContent className='p-8 md:p-12 text-center'>
            {/* Success icon */}
            <div
              data-thank-you-item
              className='inline-flex items-center justify-center w-20 h-20 rounded-full bg-linear-to-r from-vital-blue-700 to-vital-blue-600 shadow-lg shadow-vital-blue-600/25 mb-6'
              aria-hidden
            >
              <Check className='size-10 text-white' />
            </div>

            <h1
              data-thank-you-item
              className='text-3xl md:text-4xl font-bold text-slate-800 mb-3'
            >
              You&apos;re on the list
            </h1>
            <p
              data-thank-you-item
              className='text-lg text-slate-600 mb-8 max-w-[45ch] mx-auto'
            >
              Thanks for joining the Virtality waitlist. We&apos;ll be in touch
              soon with early access and your{' '}
              <span className='font-semibold text-vital-blue-700'>
                special discount
              </span>
              .
            </p>

            {/* What's next */}
            <div
              data-thank-you-item
              className='grid sm:grid-cols-2 gap-4 mb-8 text-left'
            >
              <div className='flex gap-3 p-4 rounded-xl bg-slate-50/80 border border-vital-blue-100/60'>
                <div className='shrink-0 w-10 h-10 rounded-lg bg-vital-blue-100 flex items-center justify-center'>
                  <Mail className='size-5 text-vital-blue-700' />
                </div>
                <div>
                  <p className='font-semibold text-slate-800 text-sm'>
                    Check your inbox
                  </p>
                  <p className='text-slate-600 text-sm'>
                    We&apos;ve sent a confirmation to your email.
                  </p>
                </div>
              </div>
              <div className='flex gap-3 p-4 rounded-xl bg-slate-50/80 border border-vital-blue-100/60'>
                <div className='shrink-0 w-10 h-10 rounded-lg bg-vital-blue-100 flex items-center justify-center'>
                  <Gift className='size-5 text-vital-blue-700' />
                </div>
                <div>
                  <p className='font-semibold text-slate-800 text-sm'>
                    Early access & offers
                  </p>
                  <p className='text-slate-600 text-sm'>
                    First to know when we launch + exclusive pricing.
                  </p>
                </div>
              </div>
            </div>

            <p
              data-thank-you-item
              className='flex items-center justify-center gap-2 text-sm text-slate-500 mb-6'
            >
              <Sparkles className='size-4 text-vital-blue-500' aria-hidden />
              Because every move matters.
            </p>

            <div data-thank-you-item>
              <Button
                asChild
                className='h-12 px-6 text-base font-semibold bg-vital-blue-700 hover:bg-vital-blue-800 shadow-lg shadow-vital-blue-700/25 hover:shadow-xl hover:shadow-vital-blue-700/30 transition-all rounded-xl group'
              >
                <Link
                  href='/'
                  className='inline-flex items-center gap-2 group/link'
                >
                  Back to home
                  <ArrowRight className='size-4 group-hover/link:translate-x-1 transition-transform' />
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
