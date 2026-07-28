'use client'

import { useEffect, useRef, useState } from 'react'
import CredibilityLogo from './credibility-logo'
import CredibilitySectionHeader from './credibility-section-header'
import {
  PRESS_LOGO_ITEMS,
  PRESS_SECTION_CONTENT,
  type PressLogoItem,
} from '../content'
import { filterValidLogoItems, getPressLinkProps } from '../lib/partner-press'
import {
  initialMarqueeDragState,
  isMarqueeAutoScrollPaused,
  marqueeDragThresholdForPointer,
  marqueeOffsetDuringPointer,
  reduceMarqueeDrag,
  shouldCancelStalePendingPointer,
  shouldCaptureMarqueePointer,
  shouldEndGestureOnLostCapture,
  shouldPauseMarqueeOnHover,
  shouldTrackMarqueeDragPointer,
  type MarqueeDragState,
} from '../lib/press-marquee-interaction'
import { cn } from '@/lib/utils'

const PRESS_MARQUEE_GAP_CLASS = 'gap-8 pe-8 md:gap-10 md:pe-10'
const PRESS_MARQUEE_DURATION_MS = 40_000

function getPressLogoHeightClass(item: PressLogoItem): string {
  if (item.wide) {
    // Wordmarks share one height; width follows the asset aspect ratio.
    // Slightly under the old letterboxed box so intrinsic sizing matches prior visual weight.
    return 'h-4 md:h-6'
  }

  // Square marks need more height to match wordmark visual weight.
  return 'h-12 md:h-14'
}

function PressLogo({ item }: { item: PressLogoItem }) {
  const logo = (
    <CredibilityLogo
      item={item}
      size='secondary'
      className={getPressLogoHeightClass(item)}
    />
  )
  const href = item.href?.trim()

  if (!href) {
    return <div className='inline-flex shrink-0'>{logo}</div>
  }

  return (
    <a
      href={href}
      {...getPressLinkProps(href)}
      className='inline-flex shrink-0'
      draggable={false}
    >
      {logo}
    </a>
  )
}

function wrapMarqueeOffset(value: number, halfWidth: number): number {
  if (halfWidth <= 0) {
    return value
  }

  let next = value % halfWidth
  if (next > 0) {
    next -= halfWidth
  }

  return next
}

function PressMarquee({ items }: { items: PressLogoItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const offsetRef = useRef(0)
  const halfWidthRef = useRef(0)
  const dragStateRef = useRef<MarqueeDragState>(initialMarqueeDragState)
  const isHoverPausedRef = useRef(false)
  const canHoverRef = useRef(false)
  const prefersReducedMotionRef = useRef(false)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const track = trackRef.current
    if (!track) {
      return
    }

    const measure = () => {
      halfWidthRef.current = track.scrollWidth / 2
      offsetRef.current = wrapMarqueeOffset(
        offsetRef.current,
        halfWidthRef.current,
      )
    }

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(track)

    return () => observer.disconnect()
  }, [items])

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const hoverMedia = window.matchMedia('(hover: hover)')

    prefersReducedMotionRef.current = reducedMotion.matches
    canHoverRef.current = hoverMedia.matches

    const onReducedMotionChange = () => {
      prefersReducedMotionRef.current = reducedMotion.matches
    }
    const onHoverCapabilityChange = () => {
      canHoverRef.current = hoverMedia.matches
      if (!shouldPauseMarqueeOnHover(hoverMedia.matches)) {
        isHoverPausedRef.current = false
      }
    }

    reducedMotion.addEventListener('change', onReducedMotionChange)
    hoverMedia.addEventListener('change', onHoverCapabilityChange)
    return () => {
      reducedMotion.removeEventListener('change', onReducedMotionChange)
      hoverMedia.removeEventListener('change', onHoverCapabilityChange)
    }
  }, [])

  useEffect(() => {
    let frame = 0
    let last = performance.now()

    const applyTransform = () => {
      const track = trackRef.current
      if (!track) {
        return
      }

      track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`
    }

    const tick = (now: number) => {
      const dt = now - last
      last = now
      const halfWidth = halfWidthRef.current

      if (
        halfWidth > 0 &&
        !isMarqueeAutoScrollPaused(
          dragStateRef.current,
          isHoverPausedRef.current,
          prefersReducedMotionRef.current,
        )
      ) {
        offsetRef.current = wrapMarqueeOffset(
          offsetRef.current - (halfWidth * dt) / PRESS_MARQUEE_DURATION_MS,
          halfWidth,
        )
      }

      applyTransform()
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    // Opening target=_blank can drop pointerup and leave sticky hover; clear both.
    const forceResumeAutoScroll = () => {
      isHoverPausedRef.current = false

      if (dragStateRef.current.phase === 'idle') {
        return
      }

      dragStateRef.current = reduceMarqueeDrag(dragStateRef.current, {
        type: 'pointercancel',
      }).state
      setIsDragging(false)
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        forceResumeAutoScroll()
      }
    }

    window.addEventListener('focus', forceResumeAutoScroll)
    window.addEventListener('pageshow', forceResumeAutoScroll)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.removeEventListener('focus', forceResumeAutoScroll)
      window.removeEventListener('pageshow', forceResumeAutoScroll)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  const applyDragResult = (
    result: ReturnType<typeof reduceMarqueeDrag>,
    options?: {
      target?: HTMLDivElement
      pointerId?: number
      pointerType?: string
    },
  ) => {
    dragStateRef.current = result.state
    setIsDragging(result.state.phase === 'dragging')

    if (
      result.capturePointer &&
      options?.target &&
      options.pointerId !== undefined &&
      shouldCaptureMarqueePointer(options.pointerType ?? 'mouse')
    ) {
      options.target.setPointerCapture(options.pointerId)
    }
  }

  const syncOffsetFromPointer = (clientX: number) => {
    const nextOffset = marqueeOffsetDuringPointer(dragStateRef.current, clientX)
    if (nextOffset === null) {
      return
    }

    offsetRef.current = wrapMarqueeOffset(nextOffset, halfWidthRef.current)

    const track = trackRef.current
    if (track) {
      track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`
    }
  }

  const endPointerGesture = (
    type: 'pointerup' | 'pointercancel' | 'lostcapture',
  ) => {
    applyDragResult(reduceMarqueeDrag(dragStateRef.current, { type }))
  }

  return (
    <div
      className={cn(
        // pan-y on the region + anchors: horizontal scrub stays with JS,
        // vertical page scroll still works. touch-action is hit-tested on the
        // element under the finger (usually a logo link).
        'relative mt-2 w-full touch-pan-y overflow-hidden select-none [&_a]:touch-pan-y',
        isDragging ? 'cursor-grabbing' : 'cursor-grab',
      )}
      onPointerDown={(event) => {
        if (event.button !== 0) {
          return
        }

        if (!shouldTrackMarqueeDragPointer(event.pointerType)) {
          return
        }

        applyDragResult(
          reduceMarqueeDrag(dragStateRef.current, {
            type: 'pointerdown',
            x: event.clientX,
            offset: offsetRef.current,
          }),
        )
      }}
      onPointerMove={(event) => {
        if (dragStateRef.current.phase === 'idle') {
          return
        }

        // Dropped pointerup (e.g. new tab) can leave a stale pending mouse gesture.
        if (
          shouldCancelStalePendingPointer(
            dragStateRef.current.phase,
            event.pointerType,
            event.buttons,
          )
        ) {
          endPointerGesture('pointercancel')
          return
        }

        const result = reduceMarqueeDrag(dragStateRef.current, {
          type: 'pointermove',
          x: event.clientX,
          threshold: marqueeDragThresholdForPointer(event.pointerType),
          currentOffset: offsetRef.current,
        })
        applyDragResult(result, {
          target: event.currentTarget,
          pointerId: event.pointerId,
          pointerType: event.pointerType,
        })
        syncOffsetFromPointer(event.clientX)
      }}
      onPointerUp={() => endPointerGesture('pointerup')}
      onPointerCancel={() => endPointerGesture('pointercancel')}
      onLostPointerCapture={(event) => {
        if (!shouldEndGestureOnLostCapture(event.buttons)) {
          return
        }

        endPointerGesture('lostcapture')
      }}
      onClickCapture={(event) => {
        // Clear sticky pause sources before the link navigates away.
        isHoverPausedRef.current = false

        const result = reduceMarqueeDrag(dragStateRef.current, {
          type: 'consumeClickGuard',
        })
        dragStateRef.current = result.state

        if (dragStateRef.current.phase !== 'idle') {
          endPointerGesture('pointercancel')
        }

        if (!result.preventClick) {
          return
        }

        event.preventDefault()
        event.stopPropagation()
      }}
      onMouseEnter={() => {
        if (!shouldPauseMarqueeOnHover(canHoverRef.current)) {
          return
        }

        isHoverPausedRef.current = true
      }}
      onMouseLeave={() => {
        isHoverPausedRef.current = false
      }}
      role='region'
      aria-label='Press logos'
    >
      <div
        className='pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-linear-to-r from-white to-transparent sm:w-24'
        aria-hidden
      />
      <div
        className='pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-linear-to-l from-white to-transparent sm:w-24'
        aria-hidden
      />

      <div
        ref={trackRef}
        className='flex w-max will-change-transform [&_img]:pointer-events-none'
      >
        <div className={cn('flex items-center', PRESS_MARQUEE_GAP_CLASS)}>
          {items.map((item) => (
            <PressLogo key={item.alt} item={item} />
          ))}
        </div>
        <div
          className={cn('flex items-center', PRESS_MARQUEE_GAP_CLASS)}
          aria-hidden
        >
          {items.map((item) => (
            <PressLogo key={`${item.alt}-clone`} item={item} />
          ))}
        </div>
      </div>
    </div>
  )
}

type PressLogosProps = {
  className?: string
}

const PressLogos = ({ className }: PressLogosProps) => {
  const pressItems = filterValidLogoItems(PRESS_LOGO_ITEMS)

  if (pressItems.length === 0) {
    return null
  }

  return (
    <div className={cn(className)}>
      <CredibilitySectionHeader content={PRESS_SECTION_CONTENT} />
      <PressMarquee items={pressItems} />
    </div>
  )
}

export default PressLogos
