'use client';
import { HeaderTemplate } from '@/components/HeaderTemplate';
import { ColumnDef } from '@tanstack/react-table';
import ActionsDropDown from './ActionsDropDown';

export function generateColumns<T extends { id: string | number }>(
  keys: readonly (keyof T)[],
  typeName: string,
): ColumnDef<T>[] {
  const baseColumns: ColumnDef<T>[] = keys.map((key) => ({
    accessorKey: key,
    header: ({ column }) => <HeaderTemplate column={column} />,
    size: 160,
    minSize: 150,
    maxSize: 400,
  }));

  const actionColumn: ColumnDef<T> = {
    id: 'actions',
    enableResizing: false,
    size: 50,
    cell: ({ row }) => (
      <ActionsDropDown
        id={row.original.id}
        rowIndex={row.index}
        typeName={typeName}
      />
    ),
  };

  return [...baseColumns, actionColumn];
}
