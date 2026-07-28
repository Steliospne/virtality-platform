'use client'

import { Film } from 'lucide-react'
import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'

type BucketVideoPreviewProps = {
  src: string
  label: string
  className?: string
  fallbackClassName?: string
  iconClassName?: string
  fill?: boolean
  autoPlay?: boolean
  loop?: boolean
  playOnHover?: boolean
}

export function BucketVideoPreview({
  src,
  label,
  className,
  fallbackClassName,
  iconClassName,
  fill = false,
  autoPlay = false,
  loop = false,
  playOnHover = false,
}: BucketVideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [failed, setFailed] = useState(false)

  const handleMouseEnter = () => {
    if (!playOnHover) {
      return
    }

    const video = videoRef.current
    if (!video) {
      return
    }

    void video.play().catch(() => {
      // Autoplay policies can reject; leave the still frame.
    })
  }

  const handleMouseLeave = () => {
    if (!playOnHover) {
      return
    }

    const video = videoRef.current
    if (!video) {
      return
    }

    video.pause()
    video.currentTime = 0
  }

  if (failed) {
    return (
      <div
        className={cn(
          'flex items-center justify-center',
          fill ? 'absolute inset-0 size-full' : 'size-12',
          fallbackClassName,
        )}
      >
        <Film
          className={cn(
            fill ? 'text-muted-foreground size-8' : 'size-12 text-zinc-400',
            iconClassName,
          )}
          aria-hidden='true'
        />
      </div>
    )
  }

  return (
    <video
      ref={videoRef}
      src={src}
      muted
      playsInline
      autoPlay={autoPlay && !playOnHover}
      loop={loop || playOnHover}
      preload={autoPlay || playOnHover ? 'auto' : 'metadata'}
      className={cn(
        'object-contain',
        fill
          ? 'absolute inset-0 size-full'
          : 'size-12 rounded-md border border-zinc-600',
        className,
      )}
      aria-label={label}
      onError={() => setFailed(true)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    />
  )
}
