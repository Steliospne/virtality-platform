'use client'
import { Bell, Gift } from 'lucide-react'
import { Card, CardContent } from '@virtality/ui/components/card'
import { WaitlistForm } from '@/sections/cta'

const WaitlistPage = () => {
  return (
    <section className='flex min-h-screen flex-col items-center bg-linear-to-br from-slate-50 to-teal-50'>
      <div className='m-auto'>
        <div className='flex flex-col items-center justify-center max-sm:p-6'>
          <h1 className='mb-6 text-4xl font-bold text-slate-800 max-sm:text-2xl md:text-5xl'>
            Thank You for Choosing Virtality
          </h1>
          <p className='mb-8 max-w-[60ch] text-xl text-slate-600 max-sm:text-base'>
            {
              "We're thrilled that you've selected our VR rehabilitation solution. We're working on the finishing touches of our revolutionary platform."
            }
          </p>
          <p className='mb-8 max-w-[60ch] text-xl text-slate-600'>
            {"We'd love to give you a "}
            <span className='text-vital-blue-700 animate-pulse font-bold underline'>
              special discount
            </span>
            {' for joining our waitlist.'}
          </p>
        </div>
        {/* Main CTA Card */}
        <Card className='container mb-12 border-0 bg-white/90 shadow-xl backdrop-blur-sm'>
          <CardContent className='p-8 md:p-12'>
            <div className='mb-8 text-center'>
              <h2 className='mb-4 text-2xl font-bold text-slate-800 md:text-3xl'>
                {'Join Us Now!'}
              </h2>
              <p className='mb-8 text-lg text-slate-600'>
                Join our exclusive waitlist to be the first to experience the
                future of VR rehabilitation and receive special launch benefits.
              </p>
            </div>
            {/* Benefits Grid */}
            <div className='mb-8 grid gap-6 md:grid-cols-2'>
              <div className='p-4 text-center'>
                <div className='mx-auto mb-3 flex size-12 items-center justify-center rounded-lg bg-teal-100'>
                  <Bell className='size-6 text-teal-600' />
                </div>
                <h3 className='mb-2 font-semibold text-slate-800'>
                  Early Access
                </h3>
                <p className='text-sm text-slate-600'>
                  Be among the first to access our platform when it launches
                </p>
              </div>
              <div className='p-4 text-center'>
                <div className='mx-auto mb-3 flex size-12 items-center justify-center rounded-lg bg-teal-100'>
                  <Gift className='size-6 text-teal-600' />
                </div>
                <h3 className='mb-2 font-semibold text-slate-800'>
                  Special Discounts
                </h3>
                <p className='text-sm text-slate-600'>
                  Exclusive pricing and promotional offers for early supporters
                </p>
              </div>
            </div>
            {/* Email Signup Form */}
            <div className='mx-auto max-w-md'>
              <WaitlistForm ctaLocation='waitlist_page' />
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

export default WaitlistPage
