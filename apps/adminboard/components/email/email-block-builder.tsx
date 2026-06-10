'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@virtality/ui/components/input'
import { BLOCK_TYPE_LABELS, createEmailBodyBlock } from '@/lib/admin-email-blocks'
import type { EmailBodyBlock } from '@virtality/shared/types'
import { bucketCdnUrl } from '@virtality/shared/utils'
import {
  ArrowDown,
  ArrowUp,
  ImageIcon,
  Plus,
  Trash2,
} from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { BucketObjectPickerDialog } from './bucket-object-picker-dialog'

type EmailBlockBuilderProps = {
  blocks: EmailBodyBlock[]
  onChange: (blocks: EmailBodyBlock[]) => void
  disabled?: boolean
}

const moveBlock = (
  blocks: EmailBodyBlock[],
  index: number,
  direction: -1 | 1,
): EmailBodyBlock[] => {
  const targetIndex = index + direction
  if (targetIndex < 0 || targetIndex >= blocks.length) {
    return blocks
  }

  const next = [...blocks]
  const [removed] = next.splice(index, 1)
  next.splice(targetIndex, 0, removed)
  return next
}

const updateBlock = (
  blocks: EmailBodyBlock[],
  index: number,
  block: EmailBodyBlock,
): EmailBodyBlock[] => blocks.map((current, currentIndex) => (currentIndex === index ? block : current))

export const EmailBlockBuilder = ({
  blocks,
  onChange,
  disabled = false,
}: EmailBlockBuilderProps) => {
  const [pickerTarget, setPickerTarget] = useState<
    { index: number; field: 'image' | 'cardImage' } | null
  >(null)

  const addBlock = (type: EmailBodyBlock['type']) => {
    onChange([...blocks, createEmailBodyBlock(type)])
  }

  const removeBlock = (index: number) => {
    onChange(blocks.filter((_, currentIndex) => currentIndex !== index))
  }

  return (
    <div className='space-y-4'>
      {blocks.length === 0 ? (
        <p className='text-muted-foreground rounded-lg border border-dashed p-6 text-sm'>
          Add Email Body Blocks to compose the message. The brand header and
          footer stay locked.
        </p>
      ) : null}

      {blocks.map((block, index) => (
        <div key={block.id} className='rounded-lg border p-4'>
          <div className='mb-3 flex items-center justify-between gap-2'>
            <p className='text-sm font-medium'>{BLOCK_TYPE_LABELS[block.type]}</p>
            <div className='flex items-center gap-1'>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                disabled={disabled || index === 0}
                onClick={() => onChange(moveBlock(blocks, index, -1))}
              >
                <ArrowUp className='size-4' />
              </Button>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                disabled={disabled || index === blocks.length - 1}
                onClick={() => onChange(moveBlock(blocks, index, 1))}
              >
                <ArrowDown className='size-4' />
              </Button>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                disabled={disabled}
                onClick={() => removeBlock(index)}
              >
                <Trash2 className='size-4' />
              </Button>
            </div>
          </div>

          {block.type === 'heading' ? (
            <div className='space-y-3'>
              <Input
                value={block.text}
                disabled={disabled}
                onChange={(event) =>
                  onChange(
                    updateBlock(blocks, index, {
                      ...block,
                      text: event.target.value,
                    }),
                  )
                }
                placeholder='Heading text'
              />
              <select
                className='bg-background w-full rounded-md border px-3 py-2 text-sm'
                value={block.level}
                disabled={disabled}
                onChange={(event) =>
                  onChange(
                    updateBlock(blocks, index, {
                      ...block,
                      level: Number(event.target.value) as 1 | 2 | 3,
                    }),
                  )
                }
              >
                <option value={1}>Level 1</option>
                <option value={2}>Level 2</option>
                <option value={3}>Level 3</option>
              </select>
            </div>
          ) : null}

          {block.type === 'paragraph' ? (
            <textarea
              className='bg-background min-h-24 w-full rounded-md border px-3 py-2 text-sm'
              value={block.text}
              disabled={disabled}
              onChange={(event) =>
                onChange(
                  updateBlock(blocks, index, {
                    ...block,
                    text: event.target.value,
                  }),
                )
              }
              placeholder='Paragraph text'
            />
          ) : null}

          {block.type === 'image' ? (
            <div className='space-y-3'>
              <div className='flex items-center gap-3'>
                <Button
                  type='button'
                  variant='outline'
                  disabled={disabled}
                  onClick={() => setPickerTarget({ index, field: 'image' })}
                >
                  <ImageIcon className='mr-2 size-4' />
                  {block.objectKey ? 'Change image' : 'Select image'}
                </Button>
                {block.objectKey ? (
                  <Image
                    src={bucketCdnUrl(block.objectKey)}
                    alt={block.alt || 'Selected image'}
                    width={64}
                    height={64}
                    className='size-16 rounded object-cover'
                  />
                ) : null}
              </div>
              {block.objectKey ? (
                <p className='font-mono text-xs text-zinc-500'>{block.objectKey}</p>
              ) : null}
              <Input
                value={block.alt}
                disabled={disabled}
                onChange={(event) =>
                  onChange(
                    updateBlock(blocks, index, {
                      ...block,
                      alt: event.target.value,
                    }),
                  )
                }
                placeholder='Alt text'
              />
            </div>
          ) : null}

          {block.type === 'button' ? (
            <div className='grid gap-3 sm:grid-cols-2'>
              <Input
                value={block.label}
                disabled={disabled}
                onChange={(event) =>
                  onChange(
                    updateBlock(blocks, index, {
                      ...block,
                      label: event.target.value,
                    }),
                  )
                }
                placeholder='Button label'
              />
              <Input
                value={block.href}
                disabled={disabled}
                onChange={(event) =>
                  onChange(
                    updateBlock(blocks, index, {
                      ...block,
                      href: event.target.value,
                    }),
                  )
                }
                placeholder='https://example.com'
              />
            </div>
          ) : null}

          {block.type === 'list' ? (
            <div className='space-y-3'>
              <label className='flex items-center gap-2 text-sm'>
                <input
                  type='checkbox'
                  checked={block.ordered}
                  disabled={disabled}
                  onChange={(event) =>
                    onChange(
                      updateBlock(blocks, index, {
                        ...block,
                        ordered: event.target.checked,
                      }),
                    )
                  }
                />
                Numbered list
              </label>
              {block.items.map((item, itemIndex) => (
                <div key={`${block.id}-${itemIndex}`} className='flex gap-2'>
                  <Input
                    value={item}
                    disabled={disabled}
                    onChange={(event) => {
                      const items = [...block.items]
                      items[itemIndex] = event.target.value
                      onChange(updateBlock(blocks, index, { ...block, items }))
                    }}
                    placeholder={`Item ${itemIndex + 1}`}
                  />
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    disabled={disabled || block.items.length === 1}
                    onClick={() => {
                      const items = block.items.filter(
                        (_, currentIndex) => currentIndex !== itemIndex,
                      )
                      onChange(
                        updateBlock(blocks, index, {
                          ...block,
                          items: items.length > 0 ? items : [''],
                        }),
                      )
                    }}
                  >
                    <Trash2 className='size-4' />
                  </Button>
                </div>
              ))}
              <Button
                type='button'
                variant='outline'
                size='sm'
                disabled={disabled}
                onClick={() =>
                  onChange(
                    updateBlock(blocks, index, {
                      ...block,
                      items: [...block.items, ''],
                    }),
                  )
                }
              >
                Add item
              </Button>
            </div>
          ) : null}

          {block.type === 'card' ? (
            <div className='space-y-3'>
              <Input
                value={block.heading ?? ''}
                disabled={disabled}
                onChange={(event) =>
                  onChange(
                    updateBlock(blocks, index, {
                      ...block,
                      heading: event.target.value,
                    }),
                  )
                }
                placeholder='Card heading (optional)'
              />
              <textarea
                className='bg-background min-h-20 w-full rounded-md border px-3 py-2 text-sm'
                value={block.body ?? ''}
                disabled={disabled}
                onChange={(event) =>
                  onChange(
                    updateBlock(blocks, index, {
                      ...block,
                      body: event.target.value,
                    }),
                  )
                }
                placeholder='Card body (optional)'
              />
              <div className='flex items-center gap-3'>
                <Button
                  type='button'
                  variant='outline'
                  disabled={disabled}
                  onClick={() => setPickerTarget({ index, field: 'cardImage' })}
                >
                  <ImageIcon className='mr-2 size-4' />
                  {block.imageObjectKey ? 'Change image' : 'Add image'}
                </Button>
                {block.imageObjectKey ? (
                  <Image
                    src={bucketCdnUrl(block.imageObjectKey)}
                    alt={block.imageAlt || 'Card image'}
                    width={64}
                    height={64}
                    className='size-16 rounded object-cover'
                  />
                ) : null}
              </div>
              {block.imageObjectKey ? (
                <>
                  <p className='font-mono text-xs text-zinc-500'>
                    {block.imageObjectKey}
                  </p>
                  <Input
                    value={block.imageAlt ?? ''}
                    disabled={disabled}
                    onChange={(event) =>
                      onChange(
                        updateBlock(blocks, index, {
                          ...block,
                          imageAlt: event.target.value,
                        }),
                      )
                    }
                    placeholder='Image alt text'
                  />
                </>
              ) : null}
              <div className='grid gap-3 sm:grid-cols-2'>
                <Input
                  value={block.buttonLabel ?? ''}
                  disabled={disabled}
                  onChange={(event) =>
                    onChange(
                      updateBlock(blocks, index, {
                        ...block,
                        buttonLabel: event.target.value,
                      }),
                    )
                  }
                  placeholder='Button label (optional)'
                />
                <Input
                  value={block.buttonHref ?? ''}
                  disabled={disabled}
                  onChange={(event) =>
                    onChange(
                      updateBlock(blocks, index, {
                        ...block,
                        buttonHref: event.target.value,
                      }),
                    )
                  }
                  placeholder='Button URL (optional)'
                />
              </div>
            </div>
          ) : null}

          {block.type === 'divider' ? (
            <p className='text-muted-foreground text-sm'>
              A horizontal divider will appear in the rendered email.
            </p>
          ) : null}
        </div>
      ))}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type='button' variant='outline' disabled={disabled}>
            <Plus className='mr-2 size-4' />
            Add block
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='start'>
          {(Object.keys(BLOCK_TYPE_LABELS) as EmailBodyBlock['type'][]).map(
            (type) => (
              <DropdownMenuItem key={type} onSelect={() => addBlock(type)}>
                {BLOCK_TYPE_LABELS[type]}
              </DropdownMenuItem>
            ),
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <BucketObjectPickerDialog
        open={pickerTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPickerTarget(null)
          }
        }}
        onSelect={(objectKey) => {
          if (!pickerTarget) {
            return
          }

          const block = blocks[pickerTarget.index]
          if (!block) {
            return
          }

          if (pickerTarget.field === 'image' && block.type === 'image') {
            onChange(
              updateBlock(blocks, pickerTarget.index, {
                ...block,
                objectKey,
              }),
            )
          }

          if (pickerTarget.field === 'cardImage' && block.type === 'card') {
            onChange(
              updateBlock(blocks, pickerTarget.index, {
                ...block,
                imageObjectKey: objectKey,
              }),
            )
          }

          setPickerTarget(null)
        }}
      />
    </div>
  )
}
