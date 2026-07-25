'use client'

import { useState } from 'react'
import { useMosaic } from '@/lib/marketing-queries'
import type { MosaicTileListItem } from '@virtality/shared/types'
import { MOSAIC_SECTION_CONTENT } from '../content'
import { MOSAIC_GRID_MOBILE_SCALE_CLASS } from '../lib/mosaic-grid'
import { shouldShowMosaicSection } from '../lib/mosaic-visibility'
import MosaicImageTile from './mosaic-image-tile'
import MosaicLightbox from './mosaic-lightbox'
import MosaicVideoTile from './mosaic-video-tile'

const GRID_BACKDROP_STYLE = {
  backgroundImage: `
    linear-gradient(to right, #08899a 1px, transparent 1px),
    linear-gradient(to bottom, #08899a 1px, transparent 1px)
  `,
  backgroundSize: '48px 48px',
} as const

const MosaicSection = () => {
  const { data } = useMosaic()
  const [lightboxTile, setLightboxTile] = useState<MosaicTileListItem | null>(
    null,
  )

  if (!data || !shouldShowMosaicSection(data.eligibility)) {
    return null
  }

  const { tiles } = data
  const isLightboxOpen = lightboxTile !== null

  const onOpenTile = (tile: MosaicTileListItem) => {
    setLightboxTile(tile)
  }

  const renderTile = (tile: MosaicTileListItem) => {
    const onOpen = () => onOpenTile(tile)

    if (tile.mediaKind === 'video') {
      return (
        <MosaicVideoTile
          key={tile.id}
          tile={tile}
          onOpen={onOpen}
          isLightboxOpen={isLightboxOpen}
        />
      )
    }

    return <MosaicImageTile key={tile.id} tile={tile} onOpen={onOpen} />
  }

  return (
    <section
      id='mosaic-section'
      className='relative overflow-hidden bg-white py-24 dark:bg-zinc-900'
    >
      <div
        className='absolute inset-0 opacity-[0.03]'
        style={GRID_BACKDROP_STYLE}
      />
      <div className='absolute top-1/2 left-1/2 size-144 -translate-x-1/2 -translate-y-1/2 rounded-full bg-vital-blue-400/10 blur-3xl' />

      <div className='container relative z-10 m-auto px-4 md:px-8'>
        <div className='mx-auto mb-12 max-w-2xl text-center'>
          <div className='mb-6 inline-flex items-center gap-2 rounded-full border border-vital-blue-100 bg-vital-blue-50 px-4 py-2 text-sm font-semibold text-vital-blue-700'>
            {MOSAIC_SECTION_CONTENT.eyebrow}
          </div>
          <h2 className='text-3xl font-bold tracking-tight text-slate-900 md:text-4xl dark:text-gray-100'>
            {MOSAIC_SECTION_CONTENT.headline}
          </h2>
          <p className='mt-4 text-lg leading-relaxed text-slate-600 dark:text-slate-300'>
            {MOSAIC_SECTION_CONTENT.description}
          </p>
        </div>

        <div className={MOSAIC_GRID_MOBILE_SCALE_CLASS}>
          <div
            className='grid aspect-square grid-cols-3 grid-rows-3 gap-2 md:gap-3'
            aria-label='Virtality in the wild media mosaic'
          >
            {tiles.map(renderTile)}
          </div>
        </div>
      </div>

      <MosaicLightbox
        tile={lightboxTile}
        onClose={() => setLightboxTile(null)}
      />
    </section>
  )
}

export default MosaicSection
