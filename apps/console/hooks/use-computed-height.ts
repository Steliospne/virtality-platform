import { useState, useEffect } from 'react'

export function useComputedHeight(
  ref: React.RefObject<HTMLElement | null>,
  offset: number = 0,
) {
  const [height, setHeight] = useState<number>(0)

  useEffect(() => {
    if (!ref.current) return

    const computeHeight = () => {
      const elementHeight = ref.current?.offsetHeight || 0
      setHeight(elementHeight - offset)
    }

    computeHeight()

    window.addEventListener('resize', computeHeight)
    return () => {
      window.removeEventListener('resize', computeHeight)
    }
  }, [ref, offset])

  return height
}
