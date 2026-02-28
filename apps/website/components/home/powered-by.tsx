'use client'

import Image from 'next/image'
import peiraios from '@/public/piraieus-logo.png'
import pos4work from '@/public/pos4work-logo.png'
import kinesio from '@/public/kinesiotherapy-logo.png'
import chiropracticCenter from '@/public/the-chiropractic-center-logo.png'
import { cn } from '@/lib/utils'

const LOGO_SRC = [pos4work, peiraios, kinesio, chiropracticCenter]
const LOGO_SLOTS = LOGO_SRC.length

const PoweredBy = () => {
  const slotIndex = (i: number) => i % LOGO_SLOTS
  const items = Array.from({ length: LOGO_SLOTS }, (_, i) => (
    <li
      key={i}
      className={cn(
        'flex shrink-0 items-center justify-center relative w-56 h-20 my-8',
        i === 2 && 'w-96',
        i === 3 && 'w-32',
      )}
    >
      <Image
        src={LOGO_SRC[slotIndex(i)]}
        alt={`Partner ${slotIndex(i)}`}
        fill
        className={cn(
          'object-contain absolute opacity-90 dark:opacity-70',
          i === 0 && 'px-8',
          i === 2 && 'bg-neutral-800 px-4',
        )}
      />
    </li>
  ))

  return (
    <section className='relative py-16 overflow-hidden bg-linear-to-b from-slate-50 via-white to-vital-blue-50/20'>
      <div className='container m-auto px-4 md:px-8'>
        <div className='text-center mb-12'>
          <div className='inline-flex items-center gap-2 rounded-full bg-vital-blue-700/10 px-4 py-2 text-sm font-semibold text-vital-blue-700 mb-4'>
            <span>Strategic Partnership</span>
          </div>
          <h2 className='text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3'>
            Supported By
          </h2>
          <p className='text-slate-600 dark:text-gray-300 max-w-2xl mx-auto'>
            Our innovation is backed by leading institutions and clinics
            committed to advancing healthcare technology
          </p>
        </div>

        <ul
          className='flex justify-center list-none items-center gap-8 m-auto will-change-transform'
          aria-hidden
        >
          {items}
        </ul>
      </div>
    </section>
  )
}

export default PoweredBy
