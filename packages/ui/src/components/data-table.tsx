'use client'

import {
  ColumnDef,
  flexRender,
  type Table as TableType,
} from '@tanstack/react-table'
import { Button } from '@virtality/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@virtality/ui/components/dropdown-menu'
import { Input } from '@virtality/ui/components/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@virtality/ui/components/select'
import { Skeleton } from '@virtality/ui/components/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@virtality/ui/components/table'
import { cn } from '@virtality/ui/lib/utils'
import { AlertCircle } from 'lucide-react'
import { MouseEvent, ReactNode } from 'react'

export const DATA_TABLE_LOADING_ROW_COUNT = 8

/** Portaled UI clicks bubble through the React tree into row handlers. */
export const defaultRowNavigationExceptions = [
  '#actions',
  '#select',
  '[data-slot="dialog-content"]',
  '[data-slot="dialog-close"]',
  '[data-slot="dialog-overlay"]',
  '[data-slot="dropdown-menu-content"]',
  '[data-slot="dropdown-menu-item"]',
  '[data-slot="dropdown-menu-trigger"]',
  '[data-slot="button"]',
]

function toSelectorList(selectors?: string | string[]): string[] {
  if (!selectors) return []
  return Array.isArray(selectors) ? selectors : [selectors]
}

function getRowNavigationExceptions(
  rowNavigationExceptions?: string | string[],
): string[] {
  return [
    ...defaultRowNavigationExceptions,
    ...toSelectorList(rowNavigationExceptions),
  ]
}

function getRowPresentation(original: unknown) {
  const record = original as { id?: string; deletedAt?: string | null }
  const hasDeletedAt = Object.hasOwn(original as object, 'deletedAt')
  const hasId = Object.hasOwn(original as object, 'id')

  return {
    id: hasId ? record.id : undefined,
    isDeleted: hasDeletedAt && record.deletedAt !== null,
  }
}

interface DataTableHeaderProps<TData> {
  children?: ReactNode
  table: TableType<TData>
  globalFilter: string
  setGlobalFilter: (val: string) => void
  className?: string
  filters?: ReactNode
}

export function DataTableHeader<TData>({
  children,
  table,
  globalFilter,
  setGlobalFilter,
  className,
  filters,
}: DataTableHeaderProps<TData>) {
  'use no memo'
  const isColumnMissing =
    table.getAllColumns().length > table.getVisibleLeafColumns().length

  return (
    <div className='flex flex-col gap-2 py-4'>
      <div className={cn('flex items-center gap-2', className)}>
        <Input
          placeholder='Search...'
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className='max-w-sm'
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className='flex items-center'>
              {isColumnMissing && <AlertCircle />}
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='center'>
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className='capitalize'
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {children}
      </div>
      {filters}
    </div>
  )
}

interface DataTableBodyProps<TData, TValue> {
  table: TableType<TData>
  columns: ColumnDef<TData, TValue>[]
  rowNavigation?: (url: string) => void
  rowNavigationExceptions?: string | string[]
  className?: string
  isLoading?: boolean
}

export function DataTableBody<TData, TValue>({
  table,
  columns,
  rowNavigation,
  rowNavigationExceptions,
  className,
  isLoading = false,
}: DataTableBodyProps<TData, TValue>) {
  'use no memo'

  const rowClickHandler = (event: MouseEvent) => {
    event.stopPropagation()
    if (!rowNavigation) return

    const target = event.target as HTMLElement
    const rowElement = event.currentTarget as HTMLElement
    const navigationExceptions = getRowNavigationExceptions(
      rowNavigationExceptions,
    )

    for (const exception of navigationExceptions) {
      if (target.closest(exception)) return
    }

    rowNavigation(rowElement.id)
  }

  const visibleColumns = table.getVisibleLeafColumns()
  const rows = table.getRowModel().rows

  const renderBodyContent = () => {
    if (isLoading) {
      return Array.from({ length: DATA_TABLE_LOADING_ROW_COUNT }).map(
        (_, rowIndex) => (
          <TableRow
            key={`loading-row-${rowIndex}`}
            data-testid='data-table-skeleton-row'
          >
            {visibleColumns.map((column) => (
              <TableCell key={column.id}>
                <Skeleton
                  data-testid='data-table-skeleton-cell'
                  className='h-5 w-full max-w-48'
                />
              </TableCell>
            ))}
          </TableRow>
        ),
      )
    }

    if (!rows?.length) {
      return (
        <TableRow>
          <TableCell colSpan={columns.length} className='h-24 text-center'>
            No results.
          </TableCell>
        </TableRow>
      )
    }

    return rows.map((row) => {
      const { id, isDeleted } = getRowPresentation(row.original)

      return (
        <TableRow
          id={id}
          key={row.id}
          data-state={row.getIsSelected() && 'selected'}
          onClick={rowClickHandler}
          className={cn(
            isDeleted && 'line-through',
            rowNavigation && 'cursor-pointer',
          )}
        >
          {row.getVisibleCells().map((cell) => (
            <TableCell key={cell.id}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          ))}
        </TableRow>
      )
    })
  }

  return (
    <div className={cn('overflow-hidden rounded-md border', className)}>
      <Table className='h-full'>
        <TableHeader className='sticky top-0 z-10 bg-white dark:bg-zinc-950'>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody aria-busy={isLoading || undefined}>
          {renderBodyContent()}
        </TableBody>
      </Table>
    </div>
  )
}

interface DataTableFooterProps<TData> {
  table: TableType<TData>
}

export function DataTableFooter<TData>({ table }: DataTableFooterProps<TData>) {
  'use no memo'
  return (
    <div className='flex items-center gap-2'>
      <div className='text-muted-foreground text-sm'>
        {table.getFilteredSelectedRowModel().rows.length} of{' '}
        {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>
      <div className='flex items-center space-x-2'>
        <p className='text-sm font-medium'>Rows per page</p>
        <Select
          value={`${table.getState().pagination.pageSize}`}
          onValueChange={(value) => {
            table.setPageSize(Number(value))
          }}
        >
          <SelectTrigger className='h-8 w-[70px]'>
            <SelectValue placeholder={table.getState().pagination.pageSize} />
          </SelectTrigger>
          <SelectContent side='top'>
            {[10, 20, 25, 30, 40, 50].map((pageSize) => (
              <SelectItem key={pageSize} value={`${pageSize}`}>
                {pageSize}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className='ml-auto flex items-center space-x-2 py-4'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant='outline'
          size='sm'
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
