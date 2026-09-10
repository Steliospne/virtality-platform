import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockUseExercise = vi.fn()
const mockDataTableBody = vi.fn(
  (_props: { isLoading?: boolean; rowNavigation?: unknown }) => (
    <div data-testid='data-table-body' />
  ),
)

vi.mock('@virtality/react-query', () => ({
  useExercise: () => mockUseExercise(),
}))

vi.mock('@/components/resources/exercises/columns', () => ({
  columns: [{ accessorKey: 'displayName', header: 'Name' }],
}))

vi.mock('@/components/resources/exercises/exercise-draft-list', () => ({
  ExerciseDraftList: () => <div data-testid='exercise-draft-list' />,
}))

vi.mock('@virtality/ui/components/data-table', () => ({
  DataTableHeader: ({ children }: { children?: ReactNode }) => (
    <div data-testid='data-table-header'>{children}</div>
  ),
  DataTableBody: (props: { isLoading?: boolean; rowNavigation?: unknown }) => {
    mockDataTableBody(props)
    return <div data-testid='data-table-body' />
  },
  DataTableFooter: () => <div data-testid='data-table-footer' />,
}))

import ExerciseTable from './exercise-table'

describe('ExerciseTable', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('passes isLoading while exercises are pending', () => {
    mockUseExercise.mockReturnValue({
      data: undefined,
      isPending: true,
    })

    render(<ExerciseTable />)

    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    expect(mockDataTableBody).toHaveBeenCalledWith(
      expect.objectContaining({ isLoading: true }),
    )
  })

  it('offers Create exercise entry to the wizard route', () => {
    mockUseExercise.mockReturnValue({
      data: [],
      isPending: false,
    })

    render(<ExerciseTable />)

    const link = screen.getByTestId('create-exercise-link')
    expect(link).toHaveAttribute('href', '/resources/exercises/new')
  })

  it('does not wire row navigation', () => {
    mockUseExercise.mockReturnValue({
      data: [],
      isPending: false,
    })

    render(<ExerciseTable />)

    const props = mockDataTableBody.mock.calls.at(-1)?.[0]
    expect(props).toBeDefined()
    expect(props).not.toHaveProperty('rowNavigation')
  })
})
