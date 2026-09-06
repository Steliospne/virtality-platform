'use client'

import { useCallback, useEffect, useRef } from 'react'

const CSS_VAR = '--renew-banner-height'

/**
 * Publishes RenewPromptBanner's rendered height (including its enter/exit
 * animation) as a CSS custom property on the document root, so fixed
 * viewport-height page layouts (h-screen-with-header/-nav) can shrink to
 * avoid overflowing when the banner pushes content down.
 */
export function useRenewBannerHeight() {
  const observerRef = useRef<ResizeObserver | null>(null)

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect()
      document.documentElement.style.setProperty(CSS_VAR, '0px')
    }
  }, [])

  return useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect()

    if (!node) {
      document.documentElement.style.setProperty(CSS_VAR, '0px')
      return
    }

    const observer = new ResizeObserver(() => {
      // getBoundingClientRect (not ResizeObserver's contentRect) so the
      // banner's own border-bottom is included and the two stay in sync.
      const height = node.getBoundingClientRect().height
      document.documentElement.style.setProperty(CSS_VAR, `${height}px`)
    })
    observer.observe(node)
    observerRef.current = observer
  }, [])
}
