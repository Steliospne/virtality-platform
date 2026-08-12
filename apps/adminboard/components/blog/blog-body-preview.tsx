'use client'

import type { BodyBlock } from '@virtality/shared/types'
import Image from 'next/image'

type BlogBodyPreviewProps = {
  title: string
  excerpt: string
  cover: string
  coverFocusY: number
  blocks: BodyBlock[]
}

function youtubeEmbedUrl(watchUrl: string): string | null {
  try {
    const url = new URL(watchUrl)
    const id =
      url.searchParams.get('v') ??
      (url.hostname.includes('youtu.be')
        ? url.pathname.replace(/^\//, '')
        : null)
    if (!id) return null
    return `https://www.youtube.com/embed/${id}`
  } catch {
    return null
  }
}

export function BlogBodyPreview({
  title,
  excerpt,
  cover,
  coverFocusY,
  blocks,
}: BlogBodyPreviewProps) {
  return (
    <div className='space-y-6 rounded-lg border bg-white p-6 text-slate-900'>
      {cover ? (
        <div className='relative aspect-video overflow-hidden bg-slate-100'>
          <Image
            src={cover}
            alt=''
            fill
            unoptimized
            className='object-cover'
            style={{ objectPosition: `center ${coverFocusY}%` }}
          />
        </div>
      ) : (
        <div className='bg-muted text-muted-foreground flex aspect-video items-center justify-center text-sm'>
          Cover preview
        </div>
      )}
      <div className='space-y-2'>
        <h1 className='text-3xl font-semibold tracking-tight'>
          {title || 'Untitled'}
        </h1>
        {excerpt ? <p className='text-lg text-slate-600'>{excerpt}</p> : null}
      </div>
      <div className='space-y-4'>
        {blocks.map((block, index) => {
          const key = `${block.kind}-${index}`
          if (block.kind === 'paragraph') {
            return (
              <p key={key} className='text-base leading-relaxed text-slate-700'>
                {block.text || '…'}
              </p>
            )
          }
          if (block.kind === 'heading') {
            const Tag = block.level === 3 ? 'h3' : 'h2'
            return (
              <Tag
                key={key}
                className={
                  block.level === 3
                    ? 'text-xl font-medium'
                    : 'text-2xl font-medium'
                }
              >
                {block.text || 'Heading'}
              </Tag>
            )
          }
          if (block.kind === 'image') {
            return (
              <figure key={key} className='space-y-2'>
                {block.src ? (
                  <div className='relative aspect-video overflow-hidden bg-slate-100'>
                    <Image
                      src={block.src}
                      alt={block.alt || ''}
                      fill
                      unoptimized
                      className='object-contain'
                    />
                  </div>
                ) : (
                  <div className='bg-muted text-muted-foreground flex aspect-video items-center justify-center text-sm'>
                    Image
                  </div>
                )}
                {block.caption ? (
                  <figcaption className='text-sm text-slate-500'>
                    {block.caption}
                  </figcaption>
                ) : null}
              </figure>
            )
          }
          const embed =
            block.source === 'youtube' ? youtubeEmbedUrl(block.url) : null
          return (
            <figure key={key} className='space-y-2'>
              <div className='relative aspect-video overflow-hidden bg-slate-900'>
                {block.source === 'youtube' && embed ? (
                  <iframe
                    src={embed}
                    title={block.caption ?? 'Video'}
                    className='absolute inset-0 h-full w-full'
                    allowFullScreen
                  />
                ) : block.source === 'cdn' && block.url ? (
                  <video
                    src={block.url}
                    controls
                    className='absolute inset-0 h-full w-full'
                  />
                ) : (
                  <div className='text-muted-foreground flex h-full items-center justify-center text-sm text-white/70'>
                    Video
                  </div>
                )}
              </div>
              {block.caption ? (
                <figcaption className='text-sm text-slate-500'>
                  {block.caption}
                </figcaption>
              ) : null}
            </figure>
          )
        })}
      </div>
    </div>
  )
}
