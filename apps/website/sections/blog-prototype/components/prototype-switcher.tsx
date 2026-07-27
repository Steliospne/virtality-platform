'use client'

import { useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { BLOG_PROTOTYPE_VARIANTS, type BlogPrototypeVariantKey } from '../types'
import { parseBlogPrototypeVariant } from '../lib/prototype-utils'

/**
 * PROTOTYPE switcher — fixed bottom bar, hidden in production builds.
 * Four variants of blog index + post look-and-feel, switchable via ?variant=
 */
const PrototypeSwitcher = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = parseBlogPrototypeVariant(
    searchParams.get('variant') ?? undefined,
  )
  const currentIndex = BLOG_PROTOTYPE_VARIANTS.findIndex(
    (variant) => variant.key === current,
  )
  const currentMeta = BLOG_PROTOTYPE_VARIANTS[currentIndex]!

  const goTo = (key: BlogPrototypeVariantKey) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('variant', key)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const cycle = (direction: -1 | 1) => {
    const nextIndex =
      (currentIndex + direction + BLOG_PROTOTYPE_VARIANTS.length) %
      BLOG_PROTOTYPE_VARIANTS.length
    goTo(BLOG_PROTOTYPE_VARIANTS[nextIndex]!.key)
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
      ) {
        return
      }

      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
        return
      }

      event.preventDefault()
      const direction = event.key === 'ArrowLeft' ? -1 : 1
      const nextIndex =
        (currentIndex + direction + BLOG_PROTOTYPE_VARIANTS.length) %
        BLOG_PROTOTYPE_VARIANTS.length
      const params = new URLSearchParams(searchParams.toString())
      params.set('variant', BLOG_PROTOTYPE_VARIANTS[nextIndex]!.key)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [currentIndex, pathname, router, searchParams])

  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className='fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-white shadow-2xl'>
      <button
        type='button'
        aria-label='Previous variant'
        onClick={() => cycle(-1)}
        className='rounded-full p-2 hover:bg-zinc-800'
      >
        <ChevronLeft className='size-4' />
      </button>
      <div className='min-w-48 text-center text-sm font-medium tracking-wide'>
        <span className='text-zinc-400'>{currentMeta.key}</span>
        <span className='mx-2 text-zinc-600'>—</span>
        <span>{currentMeta.name}</span>
      </div>
      <button
        type='button'
        aria-label='Next variant'
        onClick={() => cycle(1)}
        className='rounded-full p-2 hover:bg-zinc-800'
      >
        <ChevronRight className='size-4' />
      </button>
    </div>
  )
}

export default PrototypeSwitcher
