import { ArrowUpDown } from 'lucide-react';
import { Button } from './ui/button';
import { Column } from '@tanstack/react-table';
import { cn } from '@/lib/utils';

type HeaderTemplateProps<TData> = {
  column: Column<TData, unknown>;
  className?: string;
};
export const HeaderTemplate = <TData,>({
  column,
  className,
}: HeaderTemplateProps<TData>) => {
  return (
    <Button
      variant='ghost'
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      className={cn('cursor-pointer', className)}
    >
      {column.id}
      <ArrowUpDown className='ml-2 h-4 w-4' />
    </Button>
  );
};
