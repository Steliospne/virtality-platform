'use client'
import { Bell, Gift } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import WaitlistForm from '@/components/call-to-action/waitlist-form'
import { redirect, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const WaitlistPageWrapper = () => {
  return (
    <Suspense>
      <WaitlistPage />
    </Suspense>
  )
}

const WaitlistPage = () => {
  const params = useSearchParams()
  const plan = params.get('plan') ?? undefined

  redirect('https://linktr.ee/virtality')

  return (
    <section className='min-h-screen items-center flex flex-col bg-gradient-to-br from-slate-50 to-teal-50'>
      <div className='m-auto'>
        <div className='flex flex-col justify-center items-center max-sm:p-6'>
          <h1 className='max-sm:text-2xl text-4xl md:text-5xl font-bold text-slate-800 mb-6'>
            Thank You for Choosing Virtality
          </h1>
          <p className='text-xl max-sm:text-base text-slate-600 mb-8 max-w-[60ch]'>
            {
              "We're thrilled that you've selected our VR rehabilitation solution. We're working on the finishing touches of our revolutionary platform."
            }
          </p>
          <p className='text-xl text-slate-600 mb-8 max-w-[60ch]'>
            {"We'd love to give you a "}
            <span className='animate-pulse font-bold underline text-vital-blue-700'>
              special discount
            </span>
            {' for joining our waitlist.'}
          </p>
        </div>
        {/* Main CTA Card */}
        <Card className='mb-12 border-0 shadow-xl bg-white/90 backdrop-blur-sm container'>
          <CardContent className='p-8 md:p-12'>
            <div className='text-center mb-8'>
              <h2 className='text-2xl md:text-3xl font-bold text-slate-800 mb-4'>
                {'Join Us Now!'}
              </h2>
              <p className='text-lg text-slate-600 mb-8'>
                Join our exclusive waitlist to be the first to experience the
                future of VR rehabilitation and receive special launch benefits.
              </p>
            </div>
            {/* Benefits Grid */}
            <div className='grid md:grid-cols-2 gap-6 mb-8'>
              <div className='text-center p-4'>
                <div className='w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mx-auto mb-3'>
                  <Bell className='w-6 h-6 text-teal-600' />
                </div>
                <h3 className='font-semibold text-slate-800 mb-2'>
                  Early Access
                </h3>
                <p className='text-sm text-slate-600'>
                  Be among the first to access our platform when it launches
                </p>
              </div>
              <div className='text-center p-4'>
                <div className='w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mx-auto mb-3'>
                  <Gift className='w-6 h-6 text-teal-600' />
                </div>
                <h3 className='font-semibold text-slate-800 mb-2'>
                  Special Discounts
                </h3>
                <p className='text-sm text-slate-600'>
                  Exclusive pricing and promotional offers for early supporters
                </p>
              </div>
            </div>
            {/* Email Signup Form */}
            <div className='max-w-md mx-auto'>
              <WaitlistForm plan={plan} />
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

export default WaitlistPageWrapper
