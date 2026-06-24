import { render, screen } from '@testing-library/react'
import {
  type ColumnDef,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { describe, expect, it } from 'vitest'
import { DATA_TABLE_LOADING_ROW_COUNT, DataTableBody } from './data-table.js'

type Row = { id: string; name: string }

const columns: ColumnDef<Row>[] = [{ accessorKey: 'name', header: 'Name' }]

function renderDataTableBody({
  data,
  isLoading,
}: {
  data: Row[]
  isLoading?: boolean
}) {
  function TableBodyHarness() {
    const table = useReactTable({
      data,
      columns,
      getCoreRowModel: getCoreRowModel(),
    })

    return (
      <DataTableBody table={table} columns={columns} isLoading={isLoading} />
    )
  }

  return render(<TableBodyHarness />)
}

function getTableBody() {
  const table = screen.getByRole('table')
  const tableBody = table.querySelector('[data-slot="table-body"]')
  if (!tableBody) {
    throw new Error('Expected table body to be rendered')
  }
  return tableBody
}

describe('DataTableBody', () => {
  it('shows column-aware skeleton rows while loading', () => {
    renderDataTableBody({ data: [], isLoading: true })

    expect(screen.queryByText('No results.')).not.toBeInTheDocument()
    expect(getTableBody()).toHaveAttribute('aria-busy', 'true')
    expect(screen.getAllByTestId('data-table-skeleton-row')).toHaveLength(
      DATA_TABLE_LOADING_ROW_COUNT,
    )
    expect(screen.getAllByTestId('data-table-skeleton-cell')).toHaveLength(
      DATA_TABLE_LOADING_ROW_COUNT * columns.length,
    )
  })

  it('shows the empty state when not loading and there is no data', () => {
    renderDataTableBody({ data: [], isLoading: false })

    expect(screen.getByText('No results.')).toBeInTheDocument()
    expect(getTableBody()).not.toHaveAttribute('aria-busy')
    expect(screen.queryAllByTestId('data-table-skeleton-row')).toHaveLength(0)
  })

  it('shows populated rows when not loading and data exists', () => {
    renderDataTableBody({
      data: [{ id: 'patient-1', name: 'Ada Lovelace' }],
      isLoading: false,
    })

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.queryByText('No results.')).not.toBeInTheDocument()
    expect(screen.queryAllByTestId('data-table-skeleton-row')).toHaveLength(0)
  })
})
