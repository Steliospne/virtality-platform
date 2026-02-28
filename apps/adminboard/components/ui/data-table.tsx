'use client'

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  Cell,
} from '@tanstack/react-table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from './button'
import {
  ChangeEvent,
  createContext,
  useActionState,
  useCallback,
  useRef,
  useState,
} from 'react'
import { Input } from './input'
import { Label } from './label'
import { Check, MoreHorizontal } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'
import { cn } from '@/lib/utils'
export const TableContext = createContext<{
  handleImageUpdate?: (imageUrl: string, rowIndex: number) => void
} | null>(null)
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  updateAction: (
    state: {
      validationErrors: string | null
      values: string | null
    },
    formData?: FormData,
  ) => Promise<{
    validationErrors: string | null
    values: string | null
  }>
}
const initialState = {
  validationErrors: null,
  values: null,
}
export function DataTable<
  TData extends Record<string, unknown | null>,
  TValue,
>({ columns, data, updateAction }: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [filter, setFilter] = useState<string>('name')
  const [tableData, setTableData] = useState<TData[]>(data)
  const [activeInputId, setActiveInputId] = useState<string | null>(null)
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  type InputChange = { name: string; value: string }
  const [formState, formAction] = useActionState(updateAction, initialState)
  const [changedInputs, setChangedInputs] = useState<InputChange[]>(
    JSON.parse(formState.values!) || [],
  )
  const dataRef = useRef<TData[]>([])
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
    enableColumnResizing: true,
    columnResizeMode: 'onChange', // or 'onEnd'
  })

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>, row: TData) => {
    const { name, value } = e.target
    const index = Number(name.split('_')[0])
    const idInput = e.target.parentElement?.parentElement?.firstElementChild
      ?.firstElementChild as HTMLInputElement
    const itemId = idInput.value
    const property = name.split('_')[1] as keyof TData

    setChangedInputs((prev) => {
      return [
        { name, value },
        ...prev.filter((item) => item.name !== name),
      ].filter((item) => data[index][property] !== item.value)
    })

    const tableDataEntry = dataRef.current.find((item) => {
      if ('id' in item) return item.id === itemId
    })

    if (tableDataEntry) {
      if (row[property] === value)
        dataRef.current = dataRef.current.filter((item) => item.id !== itemId)
      tableDataEntry[property] = value as TData[typeof property]
    } else {
      const newTableDataEntry = { ...row, [property]: value }
      dataRef.current.push(newTableDataEntry)
    }

    setTableData((prev) => {
      const newData = [...prev]
      if (newData[index]) {
        newData[index] = {
          ...newData[index],
          [property]: value,
        }
      }
      return newData
    })
  }

  const handleDoubleClick = (id: string) => {
    setActiveInputId(id)
    setTimeout(() => {
      inputRefs.current[id]?.focus()
    }, 0)
  }

  const handleImageUpdate = useCallback(
    (imageUrl: string, rowIndex: number) => {
      const fieldName = 'image'
      setTableData((prev) => {
        const newData = [...prev]
        if (newData[rowIndex]) {
          newData[rowIndex] = {
            ...newData[rowIndex],
            [fieldName]: imageUrl,
          }
        }
        return newData
      })

      const tableDataEntryId = data[rowIndex].id
      const tableDataEntry = dataRef.current.find(
        (item) => item.id === tableDataEntryId,
      )

      if (tableDataEntry) {
        tableDataEntry[fieldName as keyof TData] =
          imageUrl as TData[typeof fieldName]
      } else {
        const newTableDataEntryId = {
          ...data[rowIndex],
          [fieldName]: imageUrl,
        }
        dataRef.current.push(newTableDataEntryId)
      }
    },
    [data],
  )

  const cellResolution = (cell: Cell<TData, unknown>) => {
    const col = cell.column.id as keyof TData
    const row = cell.row.index as number
    const cellValue = tableData[row][col]

    return typeof cellValue === 'boolean'
      ? cellValue.toString()
      : cellValue === null
        ? 'NULL'
        : ['createdAt', 'deletedAt', 'updatedAt'].includes(col as string)
          ? (cellValue as Date)?.toLocaleDateString()
          : (cellValue as string)
  }

  return (
    <TableContext.Provider value={{ handleImageUpdate }}>
      <div className='min-h-[calc(100svh-60px)] bg-neutral-950 p-4'>
        <div className='flex items-center py-4'>
          <Input
            placeholder={`Filter ${filter}...`}
            value={(table.getColumn(filter)?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
              table.getColumn(filter)?.setFilterValue(event.target.value)
            }
            className='max-w-sm'
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' className='h-8 w-8 p-0'>
                <span className='sr-only'>Filter by</span>
                <MoreHorizontal className='size-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              {table.getAllColumns().map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  onClick={() => setFilter(item.id)}
                >
                  {item.id}
                  <Check className={filter === item.id ? '' : 'hidden'} />
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className='overflow-auto rounded-md border'>
          <Table className='w-full table-fixed'>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      style={{
                        width: header.getSize(),
                        position: 'relative',
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                      {header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className='absolute top-0 right-0 h-full w-1 cursor-col-resize bg-white/20 select-none hover:bg-white'
                        />
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        style={{ width: cell.column.getSize() }}
                        id={cell.id}
                        onDoubleClick={() => {
                          handleDoubleClick(cell.id)
                        }}
                      >
                        {cell.column.id !== 'actions' ? (
                          <Input
                            ref={(el) => {
                              inputRefs.current[cell.id] = el
                            }}
                            disabled={activeInputId !== cell.id}
                            name={cell.id}
                            value={cellResolution(cell)}
                            className={cn(
                              'truncate border-0 outline-0',
                              changedInputs.find(
                                (item) => item.name === cell.id,
                              ) && 'border-teal-700 text-teal-700 opacity-100!',
                            )}
                            onChange={(e) => {
                              handleInputChange(e, row.original)
                            }}
                            onBlur={() => setActiveInputId(null)}
                          />
                        ) : (
                          flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className='h-24 text-center'
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {/* pagination + save */}
        <div className='flex items-center justify-end space-x-2 py-4'>
          <div className='items-center gap-2 lg:flex'>
            <Label htmlFor='rows-per-page' className='text-sm font-medium'>
              Rows per page
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value))
              }}
            >
              <SelectTrigger size='sm' className='w-20' id='rows-per-page'>
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side='top'>
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='flex w-fit items-center justify-center text-sm font-medium'>
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className='cursor-pointer'
          >
            Previous
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className='cursor-pointer'
          >
            Next
          </Button>
        </div>
        {changedInputs.length > 0 && (
          <form action={formAction}>
            <Input
              hidden
              name='inputs'
              defaultValue={JSON.stringify(dataRef.current)}
            />
            <Button type='submit'>Save Changes</Button>
          </form>
        )}
        {formState.validationErrors && (
          <p className='text-red-700'>{formState.validationErrors}</p>
        )}
      </div>
    </TableContext.Provider>
  )
}
