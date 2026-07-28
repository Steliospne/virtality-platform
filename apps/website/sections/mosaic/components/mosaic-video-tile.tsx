'use client'

import { useEffect, useRef, useState } from 'react'
import type { MosaicTileListItem } from '@virtality/shared/types'
import { shouldPlayMosaicAmbientVideo } from '../lib/mosaic-ambient-video'
import {
  MOSAIC_TILE_FRAME_CLASS,
  MOSAIC_TILE_OPEN_HOVER_CLASS,
  getMosaicTileGridStyle,
} from '../lib/mosaic-grid'
import {
  getMosaicVideoElementSrcProps,
  getMosaicVideoTileProps,
  type MosaicTileVideo,
} from '../lib/mosaic-tile'
import { cn } from '@/lib/utils'

type MosaicVideoTileProps = {
  tile: MosaicTileListItem
  onOpen: () => void
  isLightboxOpen: boolean
}

type MosaicVideoTilePlayerProps = MosaicVideoTileProps & {
  tileVideo: MosaicTileVideo
}

const MosaicVideoTilePlayer = ({
  tile,
  tileVideo,
  onOpen,
  isLightboxOpen,
}: MosaicVideoTilePlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [isIntersecting, setIsIntersecting] = useState(false)
  const { alt } = tileVideo
  const videoSrcProps = getMosaicVideoElementSrcProps(tileVideo)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncReducedMotion = () => {
      setPrefersReducedMotion(mediaQuery.matches)
    }

    syncReducedMotion()
    mediaQuery.addEventListener('change', syncReducedMotion)

    return () => {
      mediaQuery.removeEventListener('change', syncReducedMotion)
    }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry?.isIntersecting ?? false)
      },
      { threshold: 0.25 },
    )

    observer.observe(container)

    return () => {
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) {
      return
    }

    const shouldPlay = shouldPlayMosaicAmbientVideo({
      prefersReducedMotion,
      isIntersecting,
      lightboxOpen: isLightboxOpen,
    })

    if (shouldPlay) {
      void video.play().catch(() => {
        video.pause()
      })
    } else {
      video.pause()
    }
  }, [prefersReducedMotion, isIntersecting, isLightboxOpen])

  return (
    <div
      ref={containerRef}
      className={MOSAIC_TILE_FRAME_CLASS}
      style={getMosaicTileGridStyle(tile)}
    >
      <video
        ref={videoRef}
        className='size-full object-cover'
        muted
        playsInline
        loop
        preload='metadata'
        {...videoSrcProps}
      />
      <button
        type='button'
        onClick={onOpen}
        aria-label={alt}
        className={cn(
          MOSAIC_TILE_OPEN_HOVER_CLASS,
          'absolute inset-0 z-10 bg-transparent',
        )}
      />
    </div>
  )
}

const MosaicVideoTile = ({
  tile,
  onOpen,
  isLightboxOpen,
}: MosaicVideoTileProps) => {
  const tileVideo = getMosaicVideoTileProps(tile)

  if (!tileVideo) {
    return null
  }

  return (
    <MosaicVideoTilePlayer
      tile={tile}
      tileVideo={tileVideo}
      onOpen={onOpen}
      isLightboxOpen={isLightboxOpen}
    />
  )
}

export default MosaicVideoTile
