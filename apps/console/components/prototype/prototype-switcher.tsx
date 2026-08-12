'use client'

/**
 * PROTOTYPE ONLY: floating variant switcher for UI throwaways.
 * Hidden in production builds. Do not reuse for product chrome.
 */

import { useCallback, useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@virtality/ui/components/button'

export type PrototypeVariantMeta = {
  key: string
  name: string
}

type PrototypeSwitcherProps = {
  variants: readonly PrototypeVariantMeta[]
  param?: string
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  return target.isContentEditable
}

export function PrototypeSwitcher({
  variants,
  param = 'variant',
}: PrototypeSwitcherProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isProd = process.env.NODE_ENV === 'production'

  const currentKey = searchParams.get(param) ?? variants[0]?.key ?? 'A'
  const index = Math.max(
    0,
    variants.findIndex((variant) => variant.key === currentKey),
  )
  const current = variants[index]

  const go = useCallback(
    (nextIndex: number) => {
      if (variants.length === 0) return
      const wrapped = (nextIndex + variants.length) % variants.length
      const next = variants[wrapped]!
      const params = new URLSearchParams(searchParams.toString())
      params.set(param, next.key)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [variants, searchParams, param, router, pathname],
  )

  useEffect(() => {
    if (isProd || variants.length === 0) return

    function onKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) return
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        go(index - 1)
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        go(index + 1)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [go, index, isProd, variants.length])

  if (isProd || !current) return null

  return (
    <div className='pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4'>
      <div className='pointer-events-auto flex items-center gap-2 rounded-full border-2 border-amber-400 bg-zinc-950 px-2 py-1.5 text-white shadow-lg shadow-amber-400/30'>
        <Button
          type='button'
          size='icon'
          variant='ghost'
          className='size-8 text-white hover:bg-zinc-800 hover:text-white'
          aria-label='Previous prototype variant'
          onClick={() => go(index - 1)}
        >
          <ChevronLeft className='size-4' />
        </Button>
        <div className='min-w-48 px-2 text-center text-xs font-medium tracking-wide'>
          <span className='text-amber-300'>{current.key}</span>
          <span className='text-zinc-400'>: </span>
          <span>{current.name}</span>
        </div>
        <Button
          type='button'
          size='icon'
          variant='ghost'
          className='size-8 text-white hover:bg-zinc-800 hover:text-white'
          aria-label='Next prototype variant'
          onClick={() => go(index + 1)}
        >
          <ChevronRight className='size-4' />
        </Button>
      </div>
    </div>
  )
}
