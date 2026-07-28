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
      className='relative z-10 flex overflow-hidden pt-16 pb-24 md:py-24 dark:bg-zinc-900'
    >
      <div className='absolute inset-0 bg-linear-to-b from-slate-50 via-white to-vital-blue-50/20'></div>
      <div
        className='absolute inset-0 opacity-[0.02]'
        style={{
          backgroundImage: `
            radial-gradient(circle at 2px 2px, #08899a 1px, transparent 0)
          `,
          backgroundSize: '48px 48px',
        }}
      ></div>

      <div className='container relative z-10 m-auto px-4 pt-10 pb-16 md:px-8 md:py-16'>
        <div className='mx-auto mb-16 max-w-5xl'>
          <div className='mb-10 text-center'>
            <div className='inline-flex items-center gap-2 rounded-full bg-vital-blue-700/10 px-4 py-2 text-sm font-semibold text-vital-blue-700 mb-6'>
              <span>{BENEFITS_GRID_SECTION_CONTENT.eyebrow}</span>
            </div>
            <h2 className='text-4xl font-bold md:text-5xl text-slate-900 dark:text-white'>
              {BENEFITS_GRID_SECTION_CONTENT.titleLead}{' '}
              <span className='bg-linear-to-r from-vital-blue-700 to-vital-blue-600 bg-clip-text text-transparent'>
                {BENEFITS_GRID_SECTION_CONTENT.titleAccent}
              </span>
            </h2>
          </div>

          <div className='rounded-2xl border border-vital-blue-100/50 bg-white p-8 shadow-xl dark:bg-zinc-800'>
            <div className='grid grid-cols-1 gap-8 divide-y divide-vital-blue-100 text-center md:grid-cols-3 md:divide-x md:divide-y-0'>
              {PILOT_PROOF_CONTENT.metrics.map((metric) => (
                <div key={metric.label} className='pt-8 md:pt-0 md:px-4'>
                  <div className='mb-2 text-4xl font-bold text-vital-blue-700'>
                    {metric.value}
                  </div>
                  <div className='text-sm font-medium text-slate-600 dark:text-gray-300'>
                    {metric.label}
                  </div>
                  <div className='mt-1 text-xs text-slate-500'>
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
