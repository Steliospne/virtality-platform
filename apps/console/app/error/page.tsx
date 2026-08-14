'use client'

import { ErrorDisplay } from '@/components/ui/error-display'
import { getWebsiteUrl } from '@virtality/shared/types'
import { isTrialRedeemWaitlistRedirect } from '@virtality/shared/utils'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

const websiteURL = getWebsiteUrl()

const ErrorPage = ({ error }: { error?: Error }) => {
  const message = useSearchParams().get('message')

  useEffect(() => {
    if (isTrialRedeemWaitlistRedirect(message)) {
      window.location.assign(`${websiteURL}/waitlist`)
    }
  }, [message])

  if (isTrialRedeemWaitlistRedirect(message)) {
    return null
  }

  return (
    <ErrorDisplay
      variant='page'
      title='Something went wrong'
      message={message ?? 'Unknown error'}
    />
  )
}

export default ErrorPage
