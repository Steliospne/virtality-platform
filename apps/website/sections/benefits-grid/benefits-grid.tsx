'use client'

import HighlightCardsGrid from '@/components/shared/highlight-cards-grid'
import HighlightCardsGridSkeleton from '@/components/shared/highlight-cards-grid-skeleton'
import { useVisibleHighlightCards } from '@/components/shared/lib/use-visible-highlight-cards'
import { BENEFITS_GRID_SECTION_CONTENT, PILOT_PROOF_CONTENT } from './content'

const BenefitsGrid = () => {
  const { cards, isPending } = useVisibleHighlightCards('benefits')

  return (
    <section
      id='benefits-grid'
      className='relative z-10 flex overflow-hidden pt-10 pb-14 md:py-24 dark:bg-zinc-900'
    >
      <div className='to-vital-blue-50/20 absolute inset-0 bg-linear-to-b from-slate-50 via-white'></div>
      <div
        className='absolute inset-0 opacity-[0.02]'
        style={{
          backgroundImage: `
            radial-gradient(circle at 2px 2px, #08899a 1px, transparent 0)
          `,
          backgroundSize: '48px 48px',
        }}
      ></div>

      <div className='relative z-10 container m-auto px-4 py-8 md:px-8 md:py-16'>
        <div className='mx-auto mb-10 max-w-5xl md:mb-16'>
          <div className='mb-6 text-center md:mb-10'>
            <div className='bg-vital-blue-700/10 text-vital-blue-700 mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold md:mb-6'>
              <span>{BENEFITS_GRID_SECTION_CONTENT.eyebrow}</span>
            </div>
            <h2 className='text-3xl font-bold text-slate-900 md:text-5xl dark:text-white'>
              {BENEFITS_GRID_SECTION_CONTENT.titleLead}{' '}
              <span className='from-vital-blue-700 to-vital-blue-600 bg-linear-to-r bg-clip-text text-transparent'>
                {BENEFITS_GRID_SECTION_CONTENT.titleAccent}
              </span>
            </h2>
          </div>

          <div className='border-vital-blue-100 sm:border-vital-blue-100/50 border-y bg-transparent py-5 sm:rounded-2xl sm:border sm:bg-white sm:p-8 sm:shadow-xl dark:border-zinc-700 sm:dark:bg-zinc-800'>
            <div className='divide-vital-blue-100 grid grid-cols-3 divide-x text-center'>
              {PILOT_PROOF_CONTENT.metrics.map((metric) => (
                <div key={metric.label} className='px-2 md:px-4'>
                  <div className='text-vital-blue-700 mb-1 text-2xl font-bold md:mb-2 md:text-4xl'>
                    {metric.value}
                  </div>
                  <div className='text-[11px] leading-tight font-medium text-slate-600 md:text-sm dark:text-gray-300'>
                    {metric.label}
                  </div>
                  <div className='mt-1 text-[10px] leading-tight text-slate-500 sm:text-xs'>
                    {metric.caption}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {isPending ? (
          <HighlightCardsGridSkeleton />
        ) : cards ? (
          <HighlightCardsGrid cards={cards} />
        ) : null}
      </div>
    </section>
  )
}

export default BenefitsGrid
