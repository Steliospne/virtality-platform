'use client'

import HighlightCardsGrid from '@/components/shared/highlight-cards-grid'
import HighlightCardsGridSkeleton from '@/components/shared/highlight-cards-grid-skeleton'
import { useVisibleHighlightCards } from '@/components/shared/lib/use-visible-highlight-cards'
import { FEATURES_SECTION_CONTENT } from './content'

const Features = () => {
  const { cards, isPending } = useVisibleHighlightCards('features')

  return (
    <section
      id='features'
      className='relative flex overflow-hidden py-14 md:py-24 dark:bg-zinc-900'
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
        <div className='mx-auto mb-10 max-w-3xl text-center md:mb-16'>
          <div className='bg-vital-blue-700/10 text-vital-blue-700 mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold md:mb-6'>
            <span>{FEATURES_SECTION_CONTENT.eyebrow}</span>
          </div>
          <h2 className='mb-4 text-3xl font-bold text-slate-900 md:mb-6 md:text-5xl dark:text-white'>
            {FEATURES_SECTION_CONTENT.titleLead}{' '}
            <span className='from-vital-blue-700 to-vital-blue-600 bg-linear-to-r bg-clip-text text-transparent'>
              {FEATURES_SECTION_CONTENT.titleAccent}
            </span>
          </h2>
          <p className='text-base leading-relaxed text-slate-600 md:text-lg dark:text-gray-300'>
            {FEATURES_SECTION_CONTENT.intro}
          </p>
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

export default Features
