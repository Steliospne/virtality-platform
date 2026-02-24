'use client';
import { Avatar } from '@virtality/db';
import { generateColumns } from '../GenerateColumns';
import { DataTable } from '../ui/data-table';
import { updateExercises } from '@/lib/actions/exerciseActions';

export const AvatarTable = ({ data }: { data: Avatar[] }) => {
  const fallbackKeys: (keyof Avatar)[] = ['id', 'name', 'image'];

  const keys: (keyof Avatar)[] =
    data.length > 0 ? (Object.keys(data[0]) as (keyof Avatar)[]) : fallbackKeys;

  const columns = generateColumns<Avatar>(keys as (keyof Avatar)[], 'Avatar');

  return (
    <div className='mx-auto'>
      <DataTable columns={columns} data={data} updateAction={updateExercises} />
    </div>
  );
};
