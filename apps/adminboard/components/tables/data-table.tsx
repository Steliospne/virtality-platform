'use client';

import {
  ColumnDef,
  flexRender,
  type Table as TableType,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MouseEvent, ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function DataTableHeader<TData>({
  children,
  table,
  globalFilter,
  setGlobalFilter,
  className,
  filters,
}: {
  children?: ReactNode;
  table: TableType<TData>;
  globalFilter: string;
  setGlobalFilter: (val: string) => void;
  className?: string;
  filters?: ReactNode;
}) {
  const isColumnMissing =
    table.getAllColumns().length > table.getVisibleLeafColumns().length;

  return (
    <div className='flex flex-col gap-2 py-4'>
      <div className={cn('flex items-center gap-2', className)}>
        {/* SearchBar */}
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
          <DropdownMenuContent align='end'>
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className='capitalize'
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
        {children}
      </div>
      {filters}
    </div>
  );
}

export function DataTableBody<TData, TValue>({
  table,
  columns,
  rowNavigation = false,
  className,
}: {
  table: TableType<TData>;
  columns: ColumnDef<TData, TValue>[];
  rowNavigation?: boolean;
  className?: string;
}) {
  const router = useRouter();

  const handleClick = (e: MouseEvent) => {
    if (!rowNavigation) return;
    e.stopPropagation();
    const target = e.target as HTMLElement;
    const currTarget = e.currentTarget as HTMLElement;
    const isAction = target.closest('#actions');
    if (isAction) return;

    router.push(`/resources/preset/${currTarget.id}`);
  };

  return (
    <div className={cn('overflow-hidden rounded-md border', className)}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => {
              const hasDeleted = Object.hasOwn(
                row.original as object,
                'deletedAt',
              );

              const hasId = Object.hasOwn(row.original as object, 'id');

              const isDeleted =
                hasDeleted &&
                (row.original as { deletedAt?: string | null }).deletedAt !==
                  null;

              const id = hasId
                ? (row.original as { id: string }).id
                : undefined;

              return (
                <TableRow
                  id={id}
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  onClick={handleClick}
                  className={cn(
                    isDeleted && 'line-through',
                    rowNavigation && 'cursor-pointer',
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className='h-24 text-center'>
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export function DataTableFooter<TData>({ table }: { table: TableType<TData> }) {
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
            table.setPageSize(Number(value));
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
  );
}
