'use client';
import {
  DataTableBody,
  DataTableFooter,
  DataTableHeader,
} from '@/components/tables/data-table';
import {
  ColumnDef,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { columns } from '@/components/referral/columns';
import { tableDefaults } from '@/tanstack-tables';
import useReferralCode from '@/hooks/use-referral-code';
import { Button } from '@/components/ui/button';
import { PlusSquare } from 'lucide-react';
import useCreateReferralCode from '@/hooks/use-create-referral-code';
import { toast } from 'sonner';

const ReferralTableDAL = () => {
  const { data, isLoading } = useReferralCode();
  const { mutate: createReferralCode, isPending } = useCreateReferralCode();

  const handleGenerate = () => {
    createReferralCode(undefined, {
      onSuccess: () => {
        toast.success('Referral code generated successfully');
      },
      onError: (error) => {
        toast.error('Failed to generate referral code');
        console.error(error);
      },
    });
  };

  if (isLoading) {
    return <div className='p-8'>Loading...</div>;
  }

  return (
    <ReferralTable
      columns={columns}
      data={data}
      onGenerate={handleGenerate}
      isGenerating={isPending}
    />
  );
};

export default ReferralTableDAL;

interface ReferralTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data?: TData[];
  onGenerate: () => void;
  isGenerating: boolean;
}

const ReferralTable = <TData, TValue>({
  data,
  columns,
  onGenerate,
  isGenerating,
}: ReferralTableProps<TData, TValue>) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data: data ?? [],
    columns,
    ...tableDefaults.models,
    state: {
      sorting,
      globalFilter,
      rowSelection,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
  });

  return (
    <div className='p-8'>
      <DataTableHeader
        table={table}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
      >
        <Button
          variant='primary'
          className='ml-auto flex items-center'
          onClick={onGenerate}
          disabled={isGenerating}
        >
          <PlusSquare />
          {isGenerating ? 'Generating...' : 'Generate'}
        </Button>
      </DataTableHeader>
      <DataTableBody table={table} columns={columns} />
      <DataTableFooter table={table} />
    </div>
  );
};
