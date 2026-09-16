import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LibraryCell } from './library-cell'
import { needsStorageWarning } from './storage-warning-dialog'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

const absentHandlers = {
  onDownload: vi.fn(),
  onPause: vi.fn(),
  onCancel: vi.fn(),
  onDelete: vi.fn(),
}

describe('needsStorageWarning', () => {
  it('warns when the video is larger than free space', () => {
    expect(needsStorageWarning(2_000, 1_000)).toBe(true)
  })

  it('does not warn when there is enough space', () => {
    expect(needsStorageWarning(500, 1_000)).toBe(false)
  })
})

describe('LibraryCell', () => {
  it('disables download when the room is not complete', () => {
    render(
      <LibraryCell
        cell={{ type: 'absent' }}
        roomComplete={false}
        frozen={false}
        sizeBytes={1_000_000}
        freeBytes={10_000_000}
        {...absentHandlers}
      />,
    )

    expect(screen.getByRole('button', { name: /Download/ })).toBeDisabled()
  })

  it('opens a storage warning when the video is larger than free space', () => {
    render(
      <LibraryCell
        cell={{ type: 'absent' }}
        roomComplete={true}
        frozen={false}
        sizeBytes={5_000_000_000}
        freeBytes={1_000_000_000}
        {...absentHandlers}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Download/ }))

    expect(
      screen.getByText(
        'This headset has 1.0 GB free and the video is 5.0 GB. The download will fail unless space is freed.',
      ),
    ).toBeInTheDocument()
    expect(absentHandlers.onDownload).not.toHaveBeenCalled()
  })
})
