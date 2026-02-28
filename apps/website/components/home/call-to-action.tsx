'use client'
import { Card, CardContent } from '@/components/ui/card'
import WaitlistForm from '../call-to-action/waitlist-form'
import { Users, TrendingUp, Clock } from 'lucide-react'

const CallToAction = ({ waitlistCount }: { waitlistCount: number }) => {
  return (
    <section id='cta' className='relative py-24 overflow-hidden'>
      {/* Background */}
      <div className='absolute inset-0 bg-gradient-to-br from-slate-50 via-vital-blue-50/30 to-white'></div>
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
      <div className='absolute top-0 left-0 w-96 h-96 bg-vital-blue-400/10 rounded-full blur-3xl'></div>
      <div className='absolute bottom-0 right-0 w-96 h-96 bg-vital-blue-600/10 rounded-full blur-3xl'></div>

      <div className='container relative z-10 m-auto px-4 md:px-8'>
        <Card className='w-full max-w-4xl mx-auto bg-white/80 backdrop-blur-sm border-2 border-vital-blue-100/50 shadow-2xl overflow-hidden'>
          <CardContent className='p-0'>
            {/* Top accent bar */}
            <div className='h-2 bg-gradient-to-r from-vital-blue-700 via-vital-blue-600 to-vital-blue-700'></div>

            <div className='p-8 md:p-12'>
              <div className='text-center mb-10'>
                <div className='inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-vital-blue-700 to-vital-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-vital-blue-700/20 mb-6'>
                  <span>Early Access Program</span>
                </div>

                <h2 className='text-3xl md:text-4xl font-bold text-slate-900 mb-4 leading-tight'>
                  Join the Future of{' '}
                  <span className='bg-gradient-to-r from-vital-blue-700 to-vital-blue-600 bg-clip-text text-transparent'>
                    Clinical Rehabilitation
                  </span>
                </h2>

                <p className='text-slate-600 text-lg leading-relaxed max-w-2xl mx-auto'>
                  Be among the first healthcare professionals to access our
                  clinical-grade VR rehabilitation platform and transform your
                  patient outcomes.
                </p>
              </div>

              <WaitlistForm />

              {/* Stats grid */}
              <div className='mt-10 pt-10 border-t border-vital-blue-100'>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
                  <div className='text-center group'>
                    <div className='inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-vital-blue-700 to-vital-blue-600 rounded-xl mb-3 group-hover:scale-110 transition-transform shadow-lg shadow-vital-blue-700/20'>
                      <Users className='w-6 h-6 text-white' />
                    </div>
                    <div className='text-3xl font-bold text-vital-blue-700 mb-1 font-[var(--font-jetbrains-mono)]'>
                      {waitlistCount + 20}+
                    </div>
                    <div className='text-sm font-medium text-slate-600'>
                      Healthcare Professionals
                    </div>
                    <div className='text-xs text-slate-500 mt-1'>
                      in early access program
                    </div>
                  </div>

                  <div className='text-center group'>
                    <div className='inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-vital-blue-700 to-vital-blue-600 rounded-xl mb-3 group-hover:scale-110 transition-transform shadow-lg shadow-vital-blue-700/20'>
                      <TrendingUp className='w-6 h-6 text-white' />
                    </div>
                    <div className='text-3xl font-bold text-vital-blue-700 mb-1 font-[var(--font-jetbrains-mono)]'>
                      95%
                    </div>
                    <div className='text-sm font-medium text-slate-600'>
                      Patient Engagement Rate
                    </div>
                    <div className='text-xs text-slate-500 mt-1'>
                      sustained throughout treatment
                    </div>
                  </div>

                  <div className='text-center group'>
                    <div className='inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-vital-blue-700 to-vital-blue-600 rounded-xl mb-3 group-hover:scale-110 transition-transform shadow-lg shadow-vital-blue-700/20'>
                      <Clock className='w-6 h-6 text-white' />
                    </div>
                    <div className='text-3xl font-bold text-vital-blue-700 mb-1 font-[var(--font-jetbrains-mono)]'>
                      50-95%
                    </div>
                    <div className='text-sm font-medium text-slate-600'>
                      Faster Recovery Time
                    </div>
                    <div className='text-xs text-slate-500 mt-1'>
                      vs. traditional therapy
                    </div>
                  </div>
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
