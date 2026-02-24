import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { type Image as ImageType } from '@/types/models';
import Image from 'next/image';

export const columns: ColumnDef<ImageType>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        className='size-4'
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value: unknown) =>
          table.toggleAllPageRowsSelected(!!value)
        }
        aria-label='Select all'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        className='size-4'
        checked={row.getIsSelected()}
        onCheckedChange={(value: unknown) => row.toggleSelected(!!value)}
        aria-label='Select row'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'imageURL',
    header: 'Image',
    cell: ({ row }) => (
      <Image
        src={row.getValue('imageURL')}
        alt=''
        width={120} // or any small size you prefer
        height={120}
        className='size-[120px] rounded-md border border-zinc-600 object-contain'
      />
    ),
  },
  {
    accessorKey: 'key',
    header: 'File Name',
    cell: ({ row }) => <div className='lowercase'>{row.getValue('key')}</div>,
  },
  {
    accessorKey: 'resource',
    header: () => <div>Resource</div>,
  },
];
