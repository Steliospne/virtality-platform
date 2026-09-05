import { CheckCircle2, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import { shouldBypassVercelImageOptimization } from '@virtality/shared/utils'
import { BENEFITS_LIST_ITEMS, BENEFITS_SECTION_CONTENT } from './content'

const BENEFITS_IMAGE_SRC =
  'https://cdn.virtality.app/2e78ac55ab9e56ef44091705aabeced201df5db4e6c6a92b2133ca556a93bbee'

const Benefits = () => {
  return (
    <section id='benefits' className='relative flex overflow-hidden'>
      <div className='via-vital-blue-50/30 absolute inset-0 bg-linear-to-br from-white to-slate-50'></div>
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

      <div className='relative z-10 container m-auto px-4 py-14 md:px-8 md:py-20'>
        <div className='grid items-center gap-10 lg:grid-cols-2 lg:gap-16'>
          <div className='group relative order-2 lg:order-1'>
            <div className='from-vital-blue-600/20 to-vital-blue-400/10 absolute -inset-6 rounded-3xl bg-linear-to-br blur-2xl transition-all duration-500 group-hover:blur-3xl'></div>
            <div className='border-vital-blue-600/30 absolute -top-8 -left-8 h-32 w-32 rounded-full border-2'></div>
            <div className='border-vital-blue-500/20 absolute -right-8 -bottom-8 h-40 w-40 rounded-full border-2'></div>

            <div className='border-vital-blue-100/50 relative rounded-3xl border bg-white/90 shadow-2xl backdrop-blur-sm'>
              <Image
                src={BENEFITS_IMAGE_SRC}
                alt='Patient using VR for rehabilitation'
                width={600}
                height={600}
                unoptimized={shouldBypassVercelImageOptimization(
                  BENEFITS_IMAGE_SRC,
                )}
                className='relative mx-auto w-full rounded-2xl'
              />
            </div>
          </div>

          <div className='order-1 space-y-6 sm:space-y-8 lg:order-2'>
            <div>
              <div className='bg-vital-blue-700/10 text-vital-blue-700 mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold sm:mb-6'>
                <span>{BENEFITS_SECTION_CONTENT.eyebrow}</span>
              </div>
              <h2 className='mb-4 text-3xl font-bold text-slate-900 sm:mb-6 md:text-5xl dark:text-white'>
                {BENEFITS_SECTION_CONTENT.titleLead}{' '}
                <span className='from-vital-blue-700 to-vital-blue-600 bg-linear-to-r bg-clip-text text-transparent'>
                  {BENEFITS_SECTION_CONTENT.titleAccent}
                </span>
              </h2>
              <p className='text-base leading-relaxed text-slate-600 sm:text-lg dark:text-gray-300'>
                {BENEFITS_SECTION_CONTENT.intro}
              </p>
            </div>

            <ul className='space-y-3 sm:hidden'>
              {BENEFITS_LIST_ITEMS.map((item) => (
                <li key={item.title}>
                  <details className='group border-vital-blue-100/70 rounded-xl border bg-white/80 shadow-sm'>
                    <summary className='flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden'>
                      <div className='from-vital-blue-700 to-vital-blue-600 flex size-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br shadow-md'>
                        <CheckCircle2 className='size-4.5 text-white' />
                      </div>
                      <h3 className='min-w-0 flex-1 text-base leading-snug font-bold text-slate-900 dark:text-white'>
                        {item.title}
                      </h3>
                      <ChevronDown className='text-vital-blue-700 size-5 shrink-0 transition-transform duration-200 group-open:rotate-180' />
                    </summary>
                    <p className='px-4 pb-4 pl-16 text-sm leading-6 text-slate-600 dark:text-gray-300'>
                      {item.description}
                    </p>
                  </details>
                </li>
              ))}
            </ul>

            <ul className='hidden space-y-6 sm:block'>
              {BENEFITS_LIST_ITEMS.map((item) => (
                <li key={item.title} className='group flex items-start'>
                  <div className='mt-0.5 mr-4 shrink-0'>
                    <div className='from-vital-blue-700 to-vital-blue-600 flex size-10 items-center justify-center rounded-lg bg-linear-to-br shadow-md transition-transform group-hover:scale-110'>
                      <CheckCircle2 className='h-5 w-5 text-white' />
                    </div>
                  </div>
                  <div>
                    <h3 className='mb-2 text-lg font-bold text-slate-900 dark:text-white'>
                      {item.title}
                    </h3>
                    <p className='leading-relaxed text-slate-600 dark:text-gray-300'>
                      {item.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Benefits
