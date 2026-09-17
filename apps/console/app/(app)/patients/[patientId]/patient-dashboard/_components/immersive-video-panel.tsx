'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ImmersiveVideoSelectedCard } from './immersive-video-selected-card'

/** The selected-video card, with anything stacked under it (casting). */
export function ImmersiveVideoPanel({
  className,
  children,
}: {
  className?: string
  children?: ReactNode
}) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <ImmersiveVideoSelectedCard className='shrink-0' />
      {children}
    </div>
  )
}
