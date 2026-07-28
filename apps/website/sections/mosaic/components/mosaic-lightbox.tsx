'use client'

import { useEffect, useRef, type RefObject } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import type { MosaicTileListItem } from '@virtality/shared/types'
import { MOSAIC_LIGHTBOX_MAX_HEIGHT_CLASS } from '../lib/mosaic-grid'
import {
  getMosaicLightboxContent,
  type MosaicLightboxContent,
  type MosaicLightboxImageContent,
  type MosaicLightboxVideoContent,
} from '../lib/mosaic-lightbox'

type MosaicLightboxProps = {
  tile: MosaicTileListItem | null
  onClose: () => void
}

type MosaicLightboxMediaProps = {
  content: MosaicLightboxContent
  videoRef: RefObject<HTMLVideoElement | null>
}

const MosaicLightboxImage = ({
  content,
}: {
  content: MosaicLightboxImageContent
}) => (
  <div
    className={`relative flex ${MOSAIC_LIGHTBOX_MAX_HEIGHT_CLASS} items-center justify-center`}
  >
    <Image
      src={content.src}
      alt={content.alt}
      width={1600}
      height={1200}
      sizes='90vw'
      className={`h-auto ${MOSAIC_LIGHTBOX_MAX_HEIGHT_CLASS} w-auto max-w-full object-contain`}
    />
  </div>
)

const MosaicLightboxVideo = ({
  content,
  videoRef,
}: {
  content: MosaicLightboxVideoContent
  videoRef: RefObject<HTMLVideoElement | null>
}) => (
  <video
    ref={videoRef}
    controls
    playsInline
    preload='metadata'
    src={content.src}
    aria-label={content.alt}
    className={`${MOSAIC_LIGHTBOX_MAX_HEIGHT_CLASS} w-full bg-black`}
  />
)

const MosaicLightboxMedia = ({
  content,
  videoRef,
}: MosaicLightboxMediaProps) => {
  if (content.kind === 'image') {
    return <MosaicLightboxImage content={content} />
  }

  return <MosaicLightboxVideo content={content} videoRef={videoRef} />
}

const MosaicLightbox = ({ tile, onClose }: MosaicLightboxProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const content = tile ? getMosaicLightboxContent(tile) : null

  useEffect(() => {
    if (!content) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [content, onClose])

  useEffect(() => {
    const video = videoRef.current

    if (!content || content.kind !== 'video') {
      video?.pause()
      return
    }

    if (!video) {
      return
    }

    void video.play().catch(() => {
      video.pause()
    })
  }, [content])

  if (!content) {
    return null
  }

  return (
    <div
      role='dialog'
      aria-modal='true'
      aria-label={content.alt}
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4'
      onClick={onClose}
    >
      <button
        type='button'
        onClick={onClose}
        className='absolute top-4 right-4 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70'
      >
        <X className='size-5' />
        <span className='sr-only'>Close</span>
      </button>

      <div
        className='relative w-full max-w-5xl'
        onClick={(event) => {
          event.stopPropagation()
        }}
      >
        <MosaicLightboxMedia content={content} videoRef={videoRef} />
      </div>
    </div>
  )
}

export default MosaicLightbox
