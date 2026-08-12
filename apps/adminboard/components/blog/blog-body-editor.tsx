'use client'

import { BucketObjectPickerDialog } from '@/components/email/bucket-object-picker-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@virtality/ui/components/input'
import { Label } from '@virtality/ui/components/label'
import { Textarea } from '@virtality/ui/components/textarea'
import { bucketCdnUrl } from '@virtality/shared/utils'
import type { BodyBlock } from '@virtality/shared/types'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

type BlogBodyEditorProps = {
  blocks: BodyBlock[]
  onChange: (blocks: BodyBlock[]) => void
}

type MediaPickTarget = {
  index: number
  field: 'image' | 'cdn-video'
} | null

function moveBlock(blocks: BodyBlock[], index: number, offset: number) {
  const target = index + offset
  if (target < 0 || target >= blocks.length) {
    return blocks
  }
  const next = [...blocks]
  const [item] = next.splice(index, 1)
  next.splice(target, 0, item!)
  return next
}

export function BlogBodyEditor({ blocks, onChange }: BlogBodyEditorProps) {
  const [mediaPick, setMediaPick] = useState<MediaPickTarget>(null)

  const updateBlock = (index: number, block: BodyBlock) => {
    const next = [...blocks]
    next[index] = block
    onChange(next)
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <Label>Body</Label>
        <div className='flex flex-wrap gap-2'>
          <Button
            type='button'
            size='sm'
            variant='outline'
            onClick={() =>
              onChange([...blocks, { kind: 'paragraph', text: '' }])
            }
          >
            <Plus className='size-4' />
            Paragraph
          </Button>
          <Button
            type='button'
            size='sm'
            variant='outline'
            onClick={() =>
              onChange([...blocks, { kind: 'heading', level: 2, text: '' }])
            }
          >
            <Plus className='size-4' />
            Heading
          </Button>
          <Button
            type='button'
            size='sm'
            variant='outline'
            onClick={() =>
              onChange([
                ...blocks,
                { kind: 'image', src: '', alt: '', caption: '' },
              ])
            }
          >
            <Plus className='size-4' />
            Image
          </Button>
          <Button
            type='button'
            size='sm'
            variant='outline'
            onClick={() =>
              onChange([
                ...blocks,
                {
                  kind: 'video',
                  source: 'youtube',
                  url: '',
                  caption: '',
                },
              ])
            }
          >
            <Plus className='size-4' />
            Video
          </Button>
        </div>
      </div>

      {blocks.length === 0 ? (
        <p className='text-muted-foreground text-sm'>
          No blocks yet. Add a paragraph to start writing.
        </p>
      ) : null}

      <ul className='space-y-4'>
        {blocks.map((block, index) => (
          <li
            key={`${block.kind}-${index}`}
            className='space-y-3 rounded-lg border p-4'
          >
            <div className='flex items-center justify-between gap-2'>
              <p className='text-sm font-medium capitalize'>{block.kind}</p>
              <div className='flex gap-1'>
                <Button
                  type='button'
                  size='icon'
                  variant='ghost'
                  disabled={index === 0}
                  onClick={() => onChange(moveBlock(blocks, index, -1))}
                >
                  <ArrowUp className='size-4' />
                </Button>
                <Button
                  type='button'
                  size='icon'
                  variant='ghost'
                  disabled={index === blocks.length - 1}
                  onClick={() => onChange(moveBlock(blocks, index, 1))}
                >
                  <ArrowDown className='size-4' />
                </Button>
                <Button
                  type='button'
                  size='icon'
                  variant='ghost'
                  onClick={() =>
                    onChange(blocks.filter((_, entry) => entry !== index))
                  }
                >
                  <Trash2 className='size-4' />
                </Button>
              </div>
            </div>

            {block.kind === 'paragraph' ? (
              <Textarea
                rows={4}
                value={block.text}
                onChange={(event) =>
                  updateBlock(index, { ...block, text: event.target.value })
                }
              />
            ) : null}

            {block.kind === 'heading' ? (
              <div className='space-y-2'>
                <select
                  className='border-input bg-background h-9 w-full rounded-md border px-3 text-sm'
                  value={block.level}
                  onChange={(event) =>
                    updateBlock(index, {
                      ...block,
                      level: Number(event.target.value) as 2 | 3,
                    })
                  }
                >
                  <option value={2}>Heading 2</option>
                  <option value={3}>Heading 3</option>
                </select>
                <Input
                  value={block.text}
                  onChange={(event) =>
                    updateBlock(index, { ...block, text: event.target.value })
                  }
                />
              </div>
            ) : null}

            {block.kind === 'image' ? (
              <div className='space-y-2'>
                <div className='flex flex-wrap gap-2'>
                  <Button
                    type='button'
                    size='sm'
                    variant='outline'
                    onClick={() => setMediaPick({ index, field: 'image' })}
                  >
                    Choose image
                  </Button>
                  <Input
                    value={block.src}
                    placeholder='Image URL'
                    onChange={(event) =>
                      updateBlock(index, { ...block, src: event.target.value })
                    }
                  />
                </div>
                <Input
                  value={block.alt}
                  placeholder='Alt text'
                  onChange={(event) =>
                    updateBlock(index, { ...block, alt: event.target.value })
                  }
                />
                <Input
                  value={block.caption ?? ''}
                  placeholder='Caption (optional)'
                  onChange={(event) =>
                    updateBlock(index, {
                      ...block,
                      caption: event.target.value || undefined,
                    })
                  }
                />
              </div>
            ) : null}

            {block.kind === 'video' ? (
              <div className='space-y-2'>
                <select
                  className='border-input bg-background h-9 w-full rounded-md border px-3 text-sm'
                  value={block.source}
                  onChange={(event) =>
                    updateBlock(index, {
                      ...block,
                      source: event.target.value as 'cdn' | 'youtube',
                      url: '',
                    })
                  }
                >
                  <option value='youtube'>YouTube</option>
                  <option value='cdn'>CDN video</option>
                </select>
                {block.source === 'cdn' ? (
                  <Button
                    type='button'
                    size='sm'
                    variant='outline'
                    onClick={() => setMediaPick({ index, field: 'cdn-video' })}
                  >
                    Choose MP4
                  </Button>
                ) : null}
                <Input
                  value={block.url}
                  placeholder={
                    block.source === 'youtube'
                      ? 'https://www.youtube.com/watch?v=…'
                      : 'CDN video URL'
                  }
                  onChange={(event) =>
                    updateBlock(index, { ...block, url: event.target.value })
                  }
                />
                <Input
                  value={block.caption ?? ''}
                  placeholder='Caption (optional)'
                  onChange={(event) =>
                    updateBlock(index, {
                      ...block,
                      caption: event.target.value || undefined,
                    })
                  }
                />
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      <BucketObjectPickerDialog
        open={mediaPick !== null}
        onOpenChange={(open) => {
          if (!open) {
            setMediaPick(null)
          }
        }}
        objectKind={mediaPick?.field === 'cdn-video' ? 'mp4' : 'image'}
        onSelect={(objectKey) => {
          if (!mediaPick) {
            return
          }
          const url = bucketCdnUrl(objectKey)
          const block = blocks[mediaPick.index]
          if (!block) {
            return
          }
          if (mediaPick.field === 'image' && block.kind === 'image') {
            updateBlock(mediaPick.index, { ...block, src: url })
          }
          if (mediaPick.field === 'cdn-video' && block.kind === 'video') {
            updateBlock(mediaPick.index, {
              ...block,
              source: 'cdn',
              url,
            })
          }
          setMediaPick(null)
        }}
      />
    </div>
  )
}
