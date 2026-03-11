'use client'

import { useEffect } from 'react'
import { CommonEventProps, trackAnalyticsEvent } from '@/lib/analytics-contract'
import { usePathname } from 'next/navigation'

const PAGE_VIEW_TRACKING_KEY = 'analytics:last_page_view'
const PAGE_TAB_VIEW_TRACKING_KEY = 'analytics:last_page_tab_view'

interface usePageViewTrackingProps {
  props?: CommonEventProps
}

function usePageViewTracking({ props }: usePageViewTrackingProps = {}) {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const lastPage = sessionStorage.getItem(PAGE_VIEW_TRACKING_KEY)
    const lastTab = sessionStorage.getItem(PAGE_TAB_VIEW_TRACKING_KEY)

    if (lastPage !== pathname) {
      trackAnalyticsEvent('page_viewed', {
        page: pathname,
        ...props,
      })
      sessionStorage.setItem(PAGE_VIEW_TRACKING_KEY, pathname)
    }

    if (lastTab !== props?.tab_view && props?.tab_view) {
      trackAnalyticsEvent('page_viewed', {
        page: pathname,
        ...props,
      })
      sessionStorage.setItem(PAGE_TAB_VIEW_TRACKING_KEY, props.tab_view)
    }
  }, [pathname, props])
}

export default usePageViewTracking
