import { useCallback, useEffect, useRef, useState } from 'react'

type RailScrollState = {
  canScrollLeft: boolean
  canScrollRight: boolean
  hasOverflow: boolean
}

export function useHorizontalRailScroll(itemCount: number) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollAnimationRef = useRef<number | null>(null)
  const scrollDirectionRef = useRef<'left' | 'right' | null>(null)
  const [scrollState, setScrollState] = useState<RailScrollState>({
    canScrollLeft: false,
    canScrollRight: false,
    hasOverflow: false,
  })

  const updateScrollState = useCallback(() => {
    const element = scrollRef.current
    if (!element) return

    const hasOverflow = element.scrollWidth > element.clientWidth + 1
    setScrollState({
      hasOverflow,
      canScrollLeft: element.scrollLeft > 1,
      canScrollRight:
        element.scrollLeft + element.clientWidth < element.scrollWidth - 1,
    })
  }, [])

  const stopAutoScroll = useCallback(() => {
    scrollDirectionRef.current = null
    if (scrollAnimationRef.current !== null) {
      cancelAnimationFrame(scrollAnimationRef.current)
      scrollAnimationRef.current = null
    }
  }, [])

  const startAutoScroll = useCallback(
    (direction: 'left' | 'right') => {
      stopAutoScroll()
      scrollDirectionRef.current = direction

      const tick = () => {
        const element = scrollRef.current
        const activeDirection = scrollDirectionRef.current
        if (!element || !activeDirection) return

        const maxScroll = element.scrollWidth - element.clientWidth
        const delta = activeDirection === 'left' ? -2.2 : 2.2
        const nextScroll = element.scrollLeft + delta

        if (activeDirection === 'left' && nextScroll <= 0) {
          element.scrollLeft = 0
          stopAutoScroll()
          return
        }
        if (activeDirection === 'right' && nextScroll >= maxScroll) {
          element.scrollLeft = maxScroll
          stopAutoScroll()
          return
        }

        element.scrollLeft = nextScroll
        scrollAnimationRef.current = requestAnimationFrame(tick)
      }

      scrollAnimationRef.current = requestAnimationFrame(tick)
    },
    [stopAutoScroll],
  )

  useEffect(() => {
    updateScrollState()
    const element = scrollRef.current
    if (!element) return

    const observer = new ResizeObserver(updateScrollState)
    observer.observe(element)
    return () => observer.disconnect()
  }, [itemCount, updateScrollState])

  useEffect(() => () => stopAutoScroll(), [stopAutoScroll])

  return {
    scrollRef,
    scrollState,
    updateScrollState,
    startAutoScroll,
    stopAutoScroll,
  }
}
