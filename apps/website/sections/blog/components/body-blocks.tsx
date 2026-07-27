import Image from 'next/image'
import type { BodyBlock } from '../types'
import { youtubeEmbedUrl } from '../lib/format'

type BodyBlocksProps = {
  blocks: BodyBlock[]
  className?: string
}

const BodyBlocks = ({ blocks, className }: BodyBlocksProps) => {
  return (
    <div className={className}>
      {blocks.map((block, index) => {
        const key = `${block.kind}-${index}`

        if (block.kind === 'paragraph') {
          return (
            <p
              key={key}
              className='text-lg leading-relaxed text-slate-700 dark:text-slate-300'
            >
              {block.text}
            </p>
          )
        }

        if (block.kind === 'image') {
          return (
            <figure key={key} className='space-y-3'>
              <div className='relative aspect-video overflow-hidden bg-slate-100 dark:bg-zinc-800'>
                <Image
                  src={block.src}
                  alt={block.alt}
                  fill
                  className='object-cover'
                  sizes='(max-width: 768px) 100vw, 720px'
                />
              </div>
              {block.caption ? (
                <figcaption className='text-sm text-slate-500 dark:text-slate-400'>
                  {block.caption}
                </figcaption>
              ) : null}
            </figure>
          )
        }

        if (block.source === 'youtube') {
          const embed = youtubeEmbedUrl(block.url)
          return (
            <figure key={key} className='space-y-3'>
              <div className='relative aspect-video overflow-hidden bg-slate-900'>
                {embed ? (
                  <iframe
                    src={embed}
                    title={block.caption ?? 'Video'}
                    className='absolute inset-0 h-full w-full'
                    allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
                    allowFullScreen
                  />
                ) : (
                  <p className='p-6 text-sm text-white'>Invalid YouTube URL</p>
                )}
              </div>
              {block.caption ? (
                <figcaption className='text-sm text-slate-500 dark:text-slate-400'>
                  {block.caption}
                </figcaption>
              ) : null}
            </figure>
          )
        }

        return (
          <figure key={key} className='space-y-3'>
            <div className='relative aspect-video overflow-hidden bg-slate-900'>
              <video
                src={block.url}
                className='h-full w-full object-cover'
                controls
                playsInline
              />
            </div>
            {block.caption ? (
              <figcaption className='text-sm text-slate-500 dark:text-slate-400'>
                {block.caption}
              </figcaption>
            ) : null}
          </figure>
        )
      })}
    </div>
  )
}

export default BodyBlocks
