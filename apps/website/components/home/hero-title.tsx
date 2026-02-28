'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Activity } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { splitText } from '@/lib/utils'
import { animate, stagger } from 'motion/react'

const HeroTitle = () => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.fonts.ready.then(() => {
      if (!containerRef.current) return

      containerRef.current.style.visibility = 'visible'

      const { words, chars } = splitText(
        containerRef.current.querySelector('h1')!,
        {
          wordClass: 'split-word',
          charClass: 'split-char',
          preserveWhitespace: true,
        },
      )
      animate(
        words,
        { opacity: [0, 1], y: [20, 0] },
        {
          type: 'spring',
          duration: 1.5,
          bounce: 0,
          delay: stagger(0.04),
        },
      )
      animate(
        chars,
        { opacity: [0, 1] },
        {
          duration: 0.4,
          delay: stagger(0.008),
        },
      )
    })
  }, [])

  return (
    <div ref={containerRef} className='space-y-8'>
      <div className='inline-flex items-center gap-2 rounded-full bg-linear-to-r from-vital-blue-700 to-vital-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-vital-blue-700/20'>
        <Activity className='w-4 h-4' />
        <span className='tracking-wide'>Clinical-Grade VR Rehabilitation</span>
      </div>

      <h1 className='text-4xl font-bold leading-[1.15] md:text-5xl lg:text-6xl text-slate-900 dark:text-white'>
        Accelerate Patient Recovery with{' '}
        <span className='bg-linear-to-r from-vital-blue-700 to-vital-blue-600 bg-clip-text text-transparent'>
          Evidence-Based VR Therapy
        </span>
      </h1>

      <p className='text-lg leading-relaxed text-slate-600 dark:text-gray-300 md:text-xl max-w-xl'>
        Empower your clinical practice with precision VR rehabilitation
        technology designed for healthcare professionals treating mobility
        impairments.
      </p>

      <div className='flex flex-col sm:flex-row gap-4 pt-4'>
        <Button
          asChild
          className='h-auto px-6 py-4 text-base font-semibold bg-vital-blue-700 hover:bg-vital-blue-800 shadow-lg shadow-vital-blue-700/25 hover:shadow-xl hover:shadow-vital-blue-700/30 transition-all'
        >
          <Link
            href='https://cal.com/virtality'
            className='flex items-center gap-2 group'
            target='_blank'
          >
            Request Clinical Demo
            <ArrowRight className='w-5 h-5 group-hover:translate-x-1 transition-transform' />
          </Link>
        </Button>

        <Button
          asChild
          variant='outline'
          className='h-auto px-6 py-4 text-base font-semibold border-2 border-vital-blue-700 text-vital-blue-700 hover:bg-vital-blue-50'
        >
          <Link href='#features' className='flex items-center gap-2'>
            View Features
          </Link>
        </Button>
      </div>
    </div>
  )
}

export default HeroTitle
