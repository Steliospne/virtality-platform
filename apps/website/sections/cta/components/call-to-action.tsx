'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Clock, TrendingUp, Users, type LucideIcon } from 'lucide-react'
import { Button } from '@virtality/ui/components/button'
import { Card, CardContent } from '@virtality/ui/components/card'
import WaitlistForm from './waitlist-form'
import PartnerRowLabel from '@/components/shared/partner-row-label'
import {
  CTA_TRUST_POINTS,
  FINAL_CTA_BOOK_DEMO_LABEL,
  FINAL_CTA_JOIN_WAITLIST_LABEL,
  FINAL_CTA_SUBMIT_LABEL,
  type CtaTrustPointIconName,
} from '../content'
import { getDemoBookingUrl } from '@/lib/demo-booking'

const demoBookingUrl = getDemoBookingUrl()

const trustPointIcons: Record<CtaTrustPointIconName, LucideIcon> = {
  Users,
  TrendingUp,
  Clock,
}

const CallToAction = () => {
  const [showWaitlistForm, setShowWaitlistForm] = useState(false)

  return (
    <section id='cta' className='relative overflow-hidden py-14 md:py-24'>
      {/* Background */}
      <div className='via-vital-blue-50/30 absolute inset-0 bg-linear-to-br from-slate-50 to-white'></div>
      <div
        className='absolute inset-0 opacity-[0.02]'
        style={{
          backgroundImage: `
            radial-gradient(circle at 2px 2px, #08899a 1px, transparent 0)
          `,
          backgroundSize: '32px 32px',
        }}
      ></div>

      {/* Decorative elements */}
      <div className='bg-vital-blue-400/10 absolute top-0 left-0 h-96 w-96 rounded-full blur-3xl'></div>
      <div className='bg-vital-blue-600/10 absolute right-0 bottom-0 h-96 w-96 rounded-full blur-3xl'></div>

      <div className='relative z-10 container m-auto px-4 md:px-8'>
        <Card className='border-vital-blue-100/50 mx-auto w-full max-w-4xl overflow-hidden border-2 bg-white/80 shadow-2xl backdrop-blur-sm'>
          <CardContent className='p-0'>
            {/* Top accent bar */}
            <div className='from-vital-blue-700 via-vital-blue-600 to-vital-blue-700 h-2 bg-linear-to-r'></div>

            <div className='p-6 md:p-12'>
              <div className='mb-8 text-center md:mb-10'>
                <h2 className='mb-4 text-3xl leading-tight font-bold text-slate-900 md:text-4xl'>
                  Join the Future of{' '}
                  <span className='from-vital-blue-700 to-vital-blue-600 bg-linear-to-r bg-clip-text text-transparent'>
                    Clinical Rehabilitation
                  </span>
                </h2>

                <p className='mx-auto max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg'>
                  Be among the healthcare professionals to access our
                  clinical-grade VR rehabilitation platform and transform your
                  patient outcomes.
                </p>
              </div>

              <div className='mx-auto max-w-xl space-y-8'>
                <div className='flex flex-col'>
                  {showWaitlistForm ? (
                    <WaitlistForm
                      submitLabel={FINAL_CTA_SUBMIT_LABEL}
                      ctaLocation='final_cta'
                    />
                  ) : (
                    <Button
                      type='button'
                      variant='primary'
                      className='shadow-vital-blue-700/25 hover:shadow-vital-blue-700/30 h-auto w-full px-6 py-4 text-base font-semibold shadow-lg transition-all hover:shadow-xl'
                      onClick={() => setShowWaitlistForm(true)}
                    >
                      {FINAL_CTA_JOIN_WAITLIST_LABEL}
                    </Button>
                  )}

                  <PartnerRowLabel label='have questions?' size='large' />

                  <Button
                    asChild
                    variant='outline'
                    className='border-vital-blue-700 text-vital-blue-700 hover:bg-vital-blue-50 h-auto w-3/4 self-center border-2 px-6 py-4 text-base font-semibold'
                  >
                    <Link
                      href={demoBookingUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      {FINAL_CTA_BOOK_DEMO_LABEL}
                    </Link>
                  </Button>
                </div>
              </div>

              <div className='border-vital-blue-100 mt-8 border-t pt-8 md:mt-10 md:pt-10'>
                <div className='grid grid-cols-3 gap-2 md:gap-8'>
                  {CTA_TRUST_POINTS.map((point) => {
                    const Icon = trustPointIcons[point.icon]

                    return (
                      <div key={point.label} className='group text-center'>
                        <div className='from-vital-blue-700 to-vital-blue-600 shadow-vital-blue-700/20 mb-2 inline-flex size-9 items-center justify-center rounded-lg bg-linear-to-br shadow-lg transition-transform group-hover:scale-110 md:mb-3 md:size-12 md:rounded-xl'>
                          <Icon className='size-4 text-white md:size-6' />
                        </div>
                        <div className='text-vital-blue-700 mb-1 text-xl font-bold md:text-3xl'>
                          {point.emphasis}
                        </div>
                        <div className='text-[11px] leading-tight font-medium text-slate-600 md:text-sm'>
                          {point.label}
                        </div>
                        <div className='mt-1 hidden text-xs text-slate-500 sm:block'>
                          {point.caption}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

export default CallToAction
