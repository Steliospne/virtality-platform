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
      className='relative overflow-hidden bg-white py-24'
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
      <div className='absolute top-1/2 left-1/2 size-144 -translate-x-1/2 -translate-y-1/2 rounded-full bg-vital-blue-400/10 blur-3xl' />

      <div className='container relative z-10 m-auto px-4 md:px-8'>
        <div className='mb-12'>
          <h2 className='text-3xl font-bold tracking-tight text-slate-900 md:text-4xl'>
            What they say <span className='text-vital-blue-700'>about us</span>
          </h2>
        </div>

        <Carousel
          setApi={setApi}
          opts={{ loop: true, align: 'center' }}
          className='w-full'
        >
          <CarouselContent className='-ml-5 py-6'>
            {PLACEHOLDER_TESTIMONIALS.map((item, index) => {
              const isActive = index === current

              return (
                <CarouselItem
                  key={item.saidBy + index}
                  className='basis-[85%] pl-5 sm:basis-[70%] md:basis-[55%] lg:basis-[42%]'
                >
                  <figure
                    className={cn(
                      'flex h-full min-h-70 flex-col justify-between gap-8 border border-vital-blue-100/80 bg-white/90 p-8 shadow-[0_20px_50px_-28px_rgba(8,137,154,0.35)] transition-[opacity,transform] duration-500 select-none',
                      isActive
                        ? 'scale-100 opacity-100'
                        : 'scale-[0.96] opacity-35',
                    )}
                  >
                    <div className='flex flex-col gap-5'>
                      <span
                        aria-hidden
                        className='inline-flex text-vital-blue-700'
                      >
                        <svg
                          viewBox='0 0 24 24'
                          className='size-8'
                          fill='currentColor'
                          xmlns='http://www.w3.org/2000/svg'
                        >
                          <path d='M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.235 1.623 3.235 3.496 0 1.932-1.568 3.493-3.5 3.493-.915 0-1.776-.354-2.412-.937zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.235 1.623 3.235 3.496 0 1.932-1.568 3.493-3.5 3.493-.915 0-1.776-.354-2.412-.937z' />
                        </svg>
                      </span>
                      <blockquote>
                        <p className='text-lg leading-relaxed text-slate-700'>
                          {item.body}
                        </p>
                      </blockquote>
                    </div>
                    <figcaption className='border-t border-vital-blue-100 pt-5'>
                      <cite className='text-sm font-semibold text-slate-900 not-italic'>
                        {item.saidBy}
                      </cite>
                    </figcaption>
                  </figure>
                </CarouselItem>
              )
            })}
          </CarouselContent>
          <div className='mt-10 flex items-center justify-center gap-2'>
            <CarouselPrevious
              className='static translate-none border-vital-blue-200'
              disabled={false}
              onClick={() => scrollCarouselWithWrap(api, 'prev')}
            />
            <CarouselNext
              className='static translate-none border-vital-blue-200'
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
