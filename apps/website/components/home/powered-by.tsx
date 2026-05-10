'use client'

import Image from 'next/image'
import piraeus from '@/public/piraeus-logo.png'
import pos4work from '@/public/pos4work-logo.png'
import kinesio from '@/public/kinesiotherapy-logo.png'
import chiropracticCenter from '@/public/the-chiropractic-center-logo.png'
import { cn } from '@/lib/utils'

const PRIMARY_LOGOS = [
  { src: piraeus, alt: 'Piraeus', className: 'px-4' },
  { src: pos4work, alt: 'Pos4Work', className: 'px-4' },
]

const SECONDARY_LOGOS = [
  {
    src: kinesio,
    alt: 'Kinesiotherapy Center',
    className: 'bg-neutral-800 px-4',
    wide: true,
  },
  {
    src: chiropracticCenter,
    alt: 'The Chiropractic Center',
    className: '',
    compact: true,
  },
]

const PoweredBy = () => (
  <section className='relative py-20 overflow-hidden bg-white'>
    <div className='container m-auto px-4 md:px-8'>
      <div className='text-center mb-14'>
        <p
          className='text-[11px] font-bold tracking-[0.4em] uppercase text-vital-blue-600 mb-6'
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          Strategic Partnership
        </p>
        <h2 className='text-4xl md:text-5xl font-black text-slate-900 mb-2 leading-[1.1]'>
          Supported <span className='text-vital-blue-600'>By</span>
        </h2>
        <p className='text-slate-500 max-w-md mx-auto text-sm leading-relaxed mt-4'>
          Our innovation is backed by leading institutions and clinics committed
          to advancing healthcare technology
        </p>
      </div>

      {/* Primary logos row */}
      <div className='flex flex-col sm:flex-row justify-center items-center gap-10 mb-8'>
        {PRIMARY_LOGOS.map((logo, i) => (
          <div key={i} className='group flex flex-col items-center gap-4'>
            <div className={cn('relative w-56 h-20', logo.className)}>
              <Image
                src={logo.src}
                alt={logo.alt}
                fill
                className={cn('object-contain absolute', logo.className)}
              />
            </div>
            <div className='w-2/3 h-[2px] rounded-full bg-linear-to-r from-transparent via-vital-blue-400 to-transparent opacity-0 group-hover:opacity-70 transition-opacity duration-300' />
          </div>
        ))}
      </div>

      {/* Horizontal divider */}
      <div className='flex justify-center items-center gap-6 my-8'>
        <div className='h-px flex-1 max-w-32 bg-linear-to-r from-transparent to-slate-200' />
        <span className='text-[9px] font-bold tracking-[0.35em] uppercase text-slate-400'>
          Clinical Partners
        </span>
        <div className='h-px flex-1 max-w-32 bg-linear-to-l from-transparent to-slate-200' />
      </div>

      {/* Secondary logos row */}
      <div className='flex justify-center items-center gap-10'>
        {SECONDARY_LOGOS.map((logo, i) => (
          <div
            key={i}
            className={cn(
              'relative h-14 opacity-35 hover:opacity-80 transition-opacity duration-500',
              logo.wide ? 'w-56' : 'w-24',
            )}
          >
            <Image
              src={logo.src}
              alt={logo.alt}
              fill
              className={cn('object-contain absolute', logo.className)}
            />
          </div>
        ))}
      </div>
    </div>
  </section>
)

export default PoweredBy
