import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockUseBucket = vi.fn()

vi.mock('@virtality/react-query', () => ({
  useBucket: (args: { prefix: string }) => mockUseBucket(args),
}))

vi.mock('@virtality/shared/utils', () => ({
  getBucketBreadcrumbs: (prefix: string) =>
    prefix
      ? [
          { label: 'Bucket', prefix: '' },
          {
            label: prefix.replace(/\/$/, ''),
            prefix,
          },
        ]
      : [{ label: 'Bucket', prefix: '' }],
  shouldBypassVercelImageOptimization: () => false,
}))

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { alt, ...rest } = props
    return <img alt={typeof alt === 'string' ? alt : ''} {...rest} />
  },
}))

import { BucketObjectPickerDialog } from './bucket-object-picker-dialog'

const rootObjects = [
  {
    type: 'object' as const,
    name: 'alpha.png',
    objectKey: 'alpha.png',
    cdnUrl: 'https://cdn.example/alpha.png',
    contentType: 'image/png',
    size: 10,
    lastModified: null,
  },
  {
    type: 'object' as const,
    name: 'beta.png',
    objectKey: 'beta.png',
    cdnUrl: 'https://cdn.example/beta.png',
    contentType: 'image/png',
    size: 10,
    lastModified: null,
  },
  {
    type: 'object' as const,
    name: 'used.png',
    objectKey: 'used.png',
    cdnUrl: 'https://cdn.example/used.png',
    contentType: 'image/png',
    size: 10,
    lastModified: null,
  },
]

const nestedObjects = [
  {
    type: 'object' as const,
    name: 'gamma.png',
    objectKey: 'logos/gamma.png',
    cdnUrl: 'https://cdn.example/logos/gamma.png',
    contentType: 'image/png',
    size: 10,
    lastModified: null,
  },
]

describe('BucketObjectPickerDialog multi selection', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseBucket.mockImplementation(({ prefix }: { prefix: string }) => {
      if (prefix === 'logos/') {
        return {
          data: { folders: [], objects: nestedObjects },
          isLoading: false,
        }
      }

      return {
        data: {
          folders: [{ type: 'folder', name: 'logos', prefix: 'logos/' }],
          objects: rootObjects,
        },
        isLoading: false,
      }
    })
  })

  it('accumulates selections across folder navigation and confirms in selection order', () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()

    render(
      <BucketObjectPickerDialog
        open
        onOpenChange={onOpenChange}
        selectionMode='multiple'
        onConfirm={onConfirm}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /alpha\.png/i }))
    fireEvent.click(screen.getByRole('button', { name: /logos/i }))
    fireEvent.click(screen.getByRole('button', { name: /gamma\.png/i }))
    fireEvent.click(screen.getByRole('button', { name: /Bucket/i }))
    fireEvent.click(screen.getByRole('button', { name: /beta\.png/i }))

    expect(screen.getByText('3 selected')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))

    expect(onConfirm).toHaveBeenCalledWith([
      'alpha.png',
      'logos/gamma.png',
      'beta.png',
    ])
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('toggles a selected object back off before confirm', () => {
    const onConfirm = vi.fn()

    render(
      <BucketObjectPickerDialog
        open
        onOpenChange={vi.fn()}
        selectionMode='multiple'
        onConfirm={onConfirm}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /alpha\.png/i }))
    fireEvent.click(screen.getByRole('button', { name: /beta\.png/i }))
    fireEvent.click(screen.getByRole('button', { name: /alpha\.png/i }))

    expect(screen.getByText('1 selected')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))

    expect(onConfirm).toHaveBeenCalledWith(['beta.png'])
  })

  it('shows disabled objects as in use and does not select them', () => {
    const onConfirm = vi.fn()

    render(
      <BucketObjectPickerDialog
        open
        onOpenChange={vi.fn()}
        selectionMode='multiple'
        onConfirm={onConfirm}
        disabledObjectKeys={['used.png']}
        disabledReason='Already in use'
      />,
    )

    const usedButton = screen.getByRole('button', { name: /used\.png/i })
    expect(usedButton).toBeDisabled()
    expect(screen.getByText('Already in use')).toBeInTheDocument()

    fireEvent.click(usedButton)
    fireEvent.click(screen.getByRole('button', { name: /alpha\.png/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))

    expect(onConfirm).toHaveBeenCalledWith(['alpha.png'])
  })
})
