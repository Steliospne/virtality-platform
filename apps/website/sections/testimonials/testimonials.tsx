'use client'

import { useEffect, useState } from 'react'
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { cn } from '@/lib/utils'
import { PLACEHOLDER_TESTIMONIALS } from './content'
import {
  getClosestMiddleIndex,
  scrollCarouselWithWrap,
} from './lib/testimonial-carousel'

const initialIndex = getClosestMiddleIndex(PLACEHOLDER_TESTIMONIALS.length)

const Testimonials = () => {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(initialIndex)

  useEffect(() => {
    if (!api) return

    const sync = () => setCurrent(api.selectedScrollSnap())
    api.scrollTo(initialIndex, true)
    sync()
    api.on('select', sync)
    api.on('reInit', sync)

    return () => {
      api.off('select', sync)
      api.off('reInit', sync)
    }
  }, [api])

  return (
    <section
      id='testimonials'
      className='relative overflow-hidden bg-white py-14 sm:py-16 lg:py-24'
    >
      <div
        className='absolute inset-0 opacity-[0.03]'
        style={{
          backgroundImage: `
            linear-gradient(to right, #08899a 1px, transparent 1px),
            linear-gradient(to bottom, #08899a 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />
      <div className='bg-vital-blue-400/10 absolute top-1/2 left-1/2 size-144 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl' />

      <div className='relative z-10 container m-auto px-4 md:px-8'>
        <div className='mb-8 lg:mb-12'>
          <h2 className='text-3xl font-bold tracking-tight text-slate-900 md:text-4xl'>
            What they say <span className='text-vital-blue-700'>about us</span>
          </h2>
        </div>

        <Carousel
          setApi={setApi}
          opts={{ loop: true, align: 'center' }}
          className='w-full'
        >
          <CarouselContent className='-ml-3 py-4 sm:-ml-4 lg:-ml-5 lg:py-6'>
            {PLACEHOLDER_TESTIMONIALS.map((item, index) => {
              const isActive = index === current

              return (
                <CarouselItem
                  key={item.saidBy + index}
                  className='basis-[90%] pl-3 sm:basis-[78%] sm:pl-4 md:basis-[68%] lg:basis-[42%] lg:pl-5'
                >
                  <figure
                    className={cn(
                      'border-vital-blue-100/80 flex h-full min-h-0 flex-col justify-between gap-5 border bg-white/90 p-5 shadow-[0_20px_50px_-28px_rgba(8,137,154,0.35)] transition-[opacity,transform] duration-500 select-none sm:gap-6 sm:p-6 lg:min-h-70 lg:gap-8 lg:p-8',
                      isActive
                        ? 'scale-100 opacity-100'
                        : 'scale-[0.96] opacity-35',
                    )}
                  >
                    <div className='flex flex-col gap-3 sm:gap-4 lg:gap-5'>
                      <span
                        aria-hidden
                        className='text-vital-blue-700 inline-flex'
                      >
                        <svg
                          viewBox='0 0 24 24'
                          className='size-6 lg:size-8'
                          fill='currentColor'
                          xmlns='http://www.w3.org/2000/svg'
                        >
                          <path d='M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.235 1.623 3.235 3.496 0 1.932-1.568 3.493-3.5 3.493-.915 0-1.776-.354-2.412-.937zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.235 1.623 3.235 3.496 0 1.932-1.568 3.493-3.5 3.493-.915 0-1.776-.354-2.412-.937z' />
                        </svg>
                      </span>
                      <blockquote>
                        <p className='text-sm leading-6 text-slate-700 sm:text-base sm:leading-7 lg:text-lg lg:leading-relaxed'>
                          {item.body}
                        </p>
                      </blockquote>
                    </div>
                    <figcaption className='border-vital-blue-100 border-t pt-3 sm:pt-4 lg:pt-5'>
                      <cite className='text-xs font-semibold text-slate-900 not-italic sm:text-sm'>
                        {item.saidBy}
                      </cite>
                    </figcaption>
                  </figure>
                </CarouselItem>
              )
            })}
          </CarouselContent>
          <div className='mt-6 flex items-center justify-center gap-2 lg:mt-10'>
            <CarouselPrevious
              className='border-vital-blue-200 static translate-none'
              disabled={false}
              onClick={() => scrollCarouselWithWrap(api, 'prev')}
            />
            <CarouselNext
              className='border-vital-blue-200 static translate-none'
              disabled={false}
              onClick={() => scrollCarouselWithWrap(api, 'next')}
            />
          </div>
        </Carousel>
      </div>
    </section>
  )
}

export default Testimonials
