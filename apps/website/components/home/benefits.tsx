import { ArrowRight, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

const Benefits = () => {
  return (
    <section id='benefits' className='relative flex overflow-hidden'>
      {/* Background */}
      <div className='absolute inset-0 bg-gradient-to-br from-white via-vital-blue-50/30 to-slate-50'></div>
      <div
        className='absolute inset-0 opacity-[0.015]'
        style={{
          backgroundImage: `
            linear-gradient(135deg, #08899a 1px, transparent 1px),
            linear-gradient(225deg, #08899a 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      ></div>

      <div className='container relative z-10 m-auto px-4 md:px-8 py-20'>
        <div className='grid items-center gap-16 lg:grid-cols-2'>
          <div className='relative order-2 lg:order-1 group'>
            {/* Decorative elements */}
            <div className='absolute -inset-6 bg-gradient-to-br from-vital-blue-600/20 to-vital-blue-400/10 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500'></div>
            <div className='absolute -top-8 -left-8 w-32 h-32 border-2 border-vital-blue-600/30 rounded-full'></div>
            <div className='absolute -bottom-8 -right-8 w-40 h-40 border-2 border-vital-blue-500/20 rounded-full'></div>

            {/* Medical data visualization overlay */}
            <div className='absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-vital-blue-100 z-10 group-hover:scale-105 transition-transform'>
              <div className='flex items-center gap-3'>
                <div className='w-12 h-12 bg-gradient-to-br from-vital-blue-700 to-vital-blue-600 rounded-lg flex items-center justify-center'>
                  <CheckCircle2 className='w-6 h-6 text-white' />
                </div>
                <div>
                  <div className='text-xs font-medium text-slate-500'>
                    Recovery Rate
                  </div>
                  <div className='text-lg font-bold text-vital-blue-700 font-[var(--font-jetbrains-mono)]'>
                    +87%
                  </div>
                </div>
              </div>
            </div>

            <div className='relative bg-white/90 backdrop-blur-sm p-3 rounded-3xl shadow-2xl border border-vital-blue-100/50'>
              <Image
                src='https://cdn.virtality.app/2e78ac55ab9e56ef44091705aabeced201df5db4e6c6a92b2133ca556a93bbee'
                alt='Patient using VR for rehabilitation'
                width={600}
                height={600}
                className='relative mx-auto w-full rounded-2xl'
              />
            </div>
          </div>

          <div className='order-1 space-y-8 lg:order-2'>
            <div>
              <div className='inline-flex items-center gap-2 rounded-full bg-vital-blue-700/10 px-4 py-2 text-sm font-semibold text-vital-blue-700 mb-6'>
                <span>Clinical Advantages</span>
              </div>
              <h2 className='text-4xl font-bold md:text-5xl text-slate-900 dark:text-white mb-6'>
                Evidence-Based{' '}
                <span className='bg-gradient-to-r from-vital-blue-700 to-vital-blue-600 bg-clip-text text-transparent'>
                  VR Rehabilitation
                </span>
              </h2>
              <p className='text-lg leading-relaxed text-slate-600 dark:text-gray-300'>
                Built for physical rehabilitation professionals who demand
                precision, measurable outcomes, and superior patient results.
              </p>
            </div>

            <ul className='space-y-6'>
              <li className='flex items-start group'>
                <div className='mr-4 mt-0.5 flex-shrink-0'>
                  <div className='flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-vital-blue-700 to-vital-blue-600 shadow-md group-hover:scale-110 transition-transform'>
                    <CheckCircle2 className='w-5 h-5 text-white' />
                  </div>
                </div>
                <div>
                  <h3 className='text-lg font-bold text-slate-900 dark:text-white mb-2'>
                    Accelerated Recovery Outcomes
                  </h3>
                  <p className='text-slate-600 dark:text-gray-300 leading-relaxed'>
                    Patients experience 50–95% faster recovery and improved
                    outcomes compared to traditional therapy methods and other
                    VR systems.
                  </p>
                </div>
              </li>

              <li className='flex items-start group'>
                <div className='mr-4 mt-0.5 flex-shrink-0'>
                  <div className='flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-vital-blue-700 to-vital-blue-600 shadow-md group-hover:scale-110 transition-transform'>
                    <CheckCircle2 className='w-5 h-5 text-white' />
                  </div>
                </div>
                <div>
                  <h3 className='text-lg font-bold text-slate-900 dark:text-white mb-2'>
                    Enhanced Patient Engagement
                  </h3>
                  <p className='text-slate-600 dark:text-gray-300 leading-relaxed'>
                    Gamified therapy, intuitive design, and demonstrable results
                    maintain patient engagement and reduce dropout rates
                    significantly.
                  </p>
                </div>
              </li>

              <li className='flex items-start group'>
                <div className='mr-4 mt-0.5 flex-shrink-0'>
                  <div className='flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-vital-blue-700 to-vital-blue-600 shadow-md group-hover:scale-110 transition-transform'>
                    <CheckCircle2 className='w-5 h-5 text-white' />
                  </div>
                </div>
                <div>
                  <h3 className='text-lg font-bold text-slate-900 dark:text-white mb-2'>
                    Objective Progress Measurement
                  </h3>
                  <p className='text-slate-600 dark:text-gray-300 leading-relaxed'>
                    Precision data collection enables evidence-based treatment
                    adjustments and quantifiable outcome tracking.
                  </p>
                </div>
              </li>

              <li className='flex items-start group'>
                <div className='mr-4 mt-0.5 flex-shrink-0'>
                  <div className='flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-vital-blue-700 to-vital-blue-600 shadow-md group-hover:scale-110 transition-transform'>
                    <CheckCircle2 className='w-5 h-5 text-white' />
                  </div>
                </div>
                <div>
                  <h3 className='text-lg font-bold text-slate-900 dark:text-white mb-2'>
                    Optimized Clinical Workflow
                  </h3>
                  <p className='text-slate-600 dark:text-gray-300 leading-relaxed'>
                    Streamlined workflows boost productivity, enabling doctors
                    to treat more patients efficiently while maintaining quality
                    of care.
                  </p>
                </div>
              </li>
            </ul>

            <Link
              href='/case-studies'
              className='inline-flex items-center gap-2 font-semibold text-vital-blue-700 hover:text-vital-blue-800 dark:text-vital-blue-400 group text-lg pt-4'
            >
              View Clinical Case Studies
              <ArrowRight className='w-5 h-5 group-hover:translate-x-1 transition-transform' />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Benefits
