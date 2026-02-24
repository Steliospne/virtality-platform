import { RefObject, useEffect, useState } from 'react'

interface useScrollPercentageProps {
  scrollingContainer: RefObject<HTMLElement | null>
}

const useScrollPercentage = ({
  scrollingContainer,
}: useScrollPercentageProps) => {
  const [value, setValue] = useState(0)

  useEffect(() => {
    const container = scrollingContainer.current
    const getScrollPercentage = () => {
      if (!container) return
      const scrollTop = container.scrollTop
      const windowHeight = container.clientHeight
      const docHeight = container.scrollHeight

      const totalScrollable = docHeight - windowHeight
      setValue((scrollTop / totalScrollable) * 100)
    }

    // Example: log percentage on scroll
    container?.addEventListener('scroll', getScrollPercentage)

    return () => {
      container?.removeEventListener('scroll', getScrollPercentage)
    }
  }, [scrollingContainer])

  return value
}

export default useScrollPercentage
