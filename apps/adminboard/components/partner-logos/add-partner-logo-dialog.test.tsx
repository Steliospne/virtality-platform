import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'

const mockUseCreatePartnerLogo = vi.fn()
const mockUseUploadBucketObjects = vi.fn()
const mockUsePartnerLogos = vi.fn()

vi.mock('@virtality/shared/utils', () => ({
  bucketCdnUrl: (objectKey: string) => `https://cdn.example/${objectKey}`,
}))

vi.mock('@virtality/react-query', () => ({
  useCreatePartnerLogo: () => mockUseCreatePartnerLogo(),
  useUploadBucketObjects: () => mockUseUploadBucketObjects(),
  usePartnerLogos: () => mockUsePartnerLogos(),
}))

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { alt, ...rest } = props
    return <img alt={typeof alt === 'string' ? alt : ''} {...rest} />
  },
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}))

vi.mock('@/components/email/bucket-object-picker-dialog', () => ({
  BucketObjectPickerDialog: ({
    open,
    onConfirm,
    selectionMode,
    disabledObjectKeys,
    disabledReason,
  }: {
    open: boolean
    onConfirm?: (objectKeys: string[]) => void
    selectionMode?: 'single' | 'multiple'
    disabledObjectKeys?: readonly string[]
    disabledReason?: string
  }) => (
    <div data-testid='bucket-object-picker' data-open={open ? 'true' : 'false'}>
      <p data-testid='picker-selection-mode'>{selectionMode}</p>
      <p data-testid='picker-disabled-keys'>
        {(disabledObjectKeys ?? []).join(',')}
      </p>
      <p data-testid='picker-disabled-reason'>{disabledReason}</p>
      <button
        type='button'
        data-testid='confirm-mock-multi-pick'
        onClick={() =>
          onConfirm?.([
            'logos/first.png',
            'logos/second.png',
            'logos/third.png',
          ])
        }
      >
        Confirm mock multi pick
      </button>
    </div>
  ),
}))

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TabsList: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TabsTrigger: ({ children }: { children: ReactNode }) => (
    <button type='button'>{children}</button>
  ),
  TabsContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

import { AddPartnerLogoDialog } from './add-partner-logo-dialog'

const longFilename =
  'this-is-an-extremely-long-filename-that-would-overflow-the-dialog-without-truncation.png'

describe('AddPartnerLogoDialog', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseCreatePartnerLogo.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    })
    mockUseUploadBucketObjects.mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn(),
      reset: vi.fn(),
    })
    mockUsePartnerLogos.mockReturnValue({
      data: [{ objectKey: 'already-assigned.png' }],
    })
  })

  it('renders selected file names with truncation instead of overflowing the dialog', () => {
    render(<AddPartnerLogoDialog open onOpenChange={vi.fn()} />)

    const fileInput = screen.getByLabelText('Images')
    const file = new File(['content'], longFilename, { type: 'image/png' })

    fireEvent.change(fileInput, {
      target: { files: [file] },
    })

    const selectedFileName = screen.getByTestId(
      'partner-logo-upload-selected-file',
    )
    expect(selectedFileName).toHaveTextContent(longFilename)
    expect(selectedFileName).toHaveClass('truncate')
    expect(selectedFileName).toHaveAttribute('title', longFilename)
    expect(screen.getByText('1 file selected.')).toBeInTheDocument()
  })

  it('wires the picker in multi mode with already-assigned keys disabled', () => {
    render(<AddPartnerLogoDialog open onOpenChange={vi.fn()} />)

    expect(screen.getByTestId('picker-selection-mode')).toHaveTextContent(
      'multiple',
    )
    expect(screen.getByTestId('picker-disabled-keys')).toHaveTextContent(
      'already-assigned.png',
    )
    expect(screen.getByTestId('picker-disabled-reason')).toHaveTextContent(
      'Already in use',
    )
  })

  it('queues multi-picked images and advances to the next assignment after save', () => {
    const mutate = vi.fn(
      (_input: unknown, options?: { onSuccess?: () => void }) => {
        options?.onSuccess?.()
      },
    )
    mockUseCreatePartnerLogo.mockReturnValue({
      mutate,
      isPending: false,
    })

    render(<AddPartnerLogoDialog open onOpenChange={vi.fn()} />)

    fireEvent.click(screen.getByTestId('confirm-mock-multi-pick'))

    expect(screen.getByText('logos/first.png')).toBeInTheDocument()
    expect(screen.getByText('Assigning logo 1 of 3.')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Alt text'), {
      target: { value: 'First logo' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(mutate).toHaveBeenCalledWith(
      {
        objectKey: 'logos/first.png',
        alt: 'First logo',
        category: 'strategic',
      },
      expect.any(Object),
    )
    expect(screen.getByText('logos/second.png')).toBeInTheDocument()
    expect(screen.getByText('Assigning logo 2 of 3.')).toBeInTheDocument()
    expect(screen.getByLabelText('Alt text')).toHaveValue('')
  })
})
