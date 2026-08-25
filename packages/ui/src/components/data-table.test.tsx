import { fireEvent, render, screen } from '@testing-library/react'
import {
  type ColumnDef,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { describe, expect, it, vi } from 'vitest'
import { DATA_TABLE_LOADING_ROW_COUNT, DataTableBody } from './data-table.js'

type Row = { id: string; name: string }
type CustomerRow = { userId: string; name: string }

const columns: ColumnDef<Row>[] = [{ accessorKey: 'name', header: 'Name' }]
const customerColumns: ColumnDef<CustomerRow>[] = [
  { accessorKey: 'name', header: 'Name' },
]

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

  it('navigates with userId when the row has no id field', () => {
    const rowNavigation = vi.fn()

    function CustomerTableBodyHarness() {
      const table = useReactTable({
        data: [{ userId: 'usr_maria', name: 'Maria Kouros' }],
        columns: customerColumns,
        getCoreRowModel: getCoreRowModel(),
        getRowId: (row) => row.userId,
      })

      return (
        <DataTableBody
          table={table}
          columns={customerColumns}
          rowNavigation={rowNavigation}
        />
      )
    }

    render(<CustomerTableBodyHarness />)

    fireEvent.click(screen.getByText('Maria Kouros'))

    expect(rowNavigation).toHaveBeenCalledWith('usr_maria')
  })
})
