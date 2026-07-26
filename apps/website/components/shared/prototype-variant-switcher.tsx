'use client'

import { useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export type PrototypeVariantOption = {
  key: string
  name: string
}

type PrototypeVariantSwitcherProps = {
  variants: readonly PrototypeVariantOption[]
  paramKey?: string
  className?: string
}

/**
 * PROTOTYPE ONLY — floating bar to flip `?variant=` options.
 * Hidden in production builds.
 */
export default function PrototypeVariantSwitcher({
  variants,
  paramKey = 'variant',
  className,
}: PrototypeVariantSwitcherProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isProduction = process.env.NODE_ENV === 'production'

  const currentKey = searchParams.get(paramKey) ?? variants[0]?.key ?? 'A'
  const currentIndex = Math.max(
    0,
    variants.findIndex((variant) => variant.key === currentKey),
  )
  const current = variants[currentIndex]

  useEffect(() => {
    if (isProduction || variants.length === 0) {
      return
    }

    const goToIndex = (nextIndex: number) => {
      const wrapped =
        ((nextIndex % variants.length) + variants.length) % variants.length
      const next = variants[wrapped]
      if (!next) {
        return
      }
      const params = new URLSearchParams(searchParams.toString())
      params.set(paramKey, next.key)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (
        target?.closest('input, textarea, select, [contenteditable="true"]')
      ) {
        return
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        goToIndex(currentIndex - 1)
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        goToIndex(currentIndex + 1)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    currentIndex,
    isProduction,
    paramKey,
    pathname,
    router,
    searchParams,
    variants,
  ])

  if (isProduction || variants.length === 0 || !current) {
    return null
  }

  const goToIndex = (nextIndex: number) => {
    const wrapped =
      ((nextIndex % variants.length) + variants.length) % variants.length
    const next = variants[wrapped]
    if (!next) {
      return
    }
    const params = new URLSearchParams(searchParams.toString())
    params.set(paramKey, next.key)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex justify-center px-4',
        className,
      )}
      data-prototype-variant-switcher=''
    >
      <div className='pointer-events-auto flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-white shadow-[0_12px_40px_-12px_rgba(0,0,0,0.65)]'>
        <button
          type='button'
          aria-label='Previous prototype variant'
          className='inline-flex size-8 items-center justify-center rounded-full hover:bg-white/10'
          onClick={() => goToIndex(currentIndex - 1)}
        >
          <ChevronLeft className='size-4' />
        </button>
        <div className='min-w-52 px-2 text-center font-mono text-xs tracking-wide'>
          <span className='text-zinc-400'>{current.key}</span>
          <span className='text-zinc-500'> — </span>
          <span>{current.name}</span>
        </div>
        <button
          type='button'
          aria-label='Next prototype variant'
          className='inline-flex size-8 items-center justify-center rounded-full hover:bg-white/10'
          onClick={() => goToIndex(currentIndex + 1)}
        >
          <ChevronRight className='size-4' />
        </button>
      </div>
    </div>
  )
}
