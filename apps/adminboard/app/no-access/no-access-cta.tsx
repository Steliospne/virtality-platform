'use client'

import { Button } from '@/components/ui/button'
import { Home, AppWindow } from 'lucide-react'
import { getConsoleUrl, getWebsiteUrl } from '@virtality/shared/types'
import Link from 'next/link'

const consoleURL = getConsoleUrl()
const websiteURL = getWebsiteUrl()

export function BackToConsoleButton() {
  return (
    <Button
      variant='primary'
      size='lg'
      className='no-access-cta group focus-visible:ring-my-primary focus-visible:ring-offset-background mt-8 min-w-[180px] gap-2 rounded-lg px-6 py-3 font-medium shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl focus-visible:ring-2 focus-visible:ring-offset-2'
    >
      <AppWindow className='size-4 transition-transform group-hover:-translate-x-0.5' />
      <Link href={consoleURL}>Back to Console</Link>
    </Button>
  )
}

export function BackToWebsiteButton() {
  return (
    <Button
      variant='primary'
      size='lg'
      className='no-access-cta group focus-visible:ring-my-primary focus-visible:ring-offset-background mt-8 min-w-[180px] gap-2 rounded-lg px-6 py-3 font-medium shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl focus-visible:ring-2 focus-visible:ring-offset-2'
    >
      <Home className='size-4 transition-transform group-hover:-translate-x-0.5' />
      <Link href={websiteURL}>Back to Website</Link>
    </Button>
  )
}
