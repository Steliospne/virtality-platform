'use client';
import { Map } from '@virtality/db';
import { generateColumns } from '../GenerateColumns';
import { DataTable } from '../ui/data-table';
import { updateExercises } from '@/lib/actions/exerciseActions';

export const MapTable = ({ data }: { data: Map[] }) => {
  const fallbackKeys: (keyof Map)[] = ['id', 'name', 'image'];

  const keys: (keyof Map)[] =
    data.length > 0 ? (Object.keys(data[0]) as (keyof Map)[]) : fallbackKeys;
  const columns = generateColumns<Map>(keys as (keyof Map)[], 'Map');
  return (
    <div className='mx-auto'>
      <DataTable columns={columns} data={data} updateAction={updateExercises} />
    </div>
  );
};
