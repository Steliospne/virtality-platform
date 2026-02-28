'use client'
import { Patient } from '@virtality/db'
import { generateColumns } from '../GenerateColumns'
import { DataTable } from '../ui/data-table'
import { updatePatients } from '@/lib/actions/patientActions'

export const PatientTable = ({ data }: { data: Patient[] }) => {
  const fallbackKeys: (keyof Patient)[] = [
    'id',
    'name',
    'userId',
    'email',
    'phone',
    'dob',
    'sex',
    'weight',
    'height',
    'image',
    'createdAt',
    'updatedAt',
  ]

  const keys: (keyof Patient)[] =
    data.length > 0 ? (Object.keys(data[0]) as (keyof Patient)[]) : fallbackKeys

  const columns = generateColumns<Patient>(keys as (keyof Patient)[], 'Patient')
  return (
    <div className='mx-auto'>
      <DataTable columns={columns} data={data} updateAction={updatePatients} />
    </div>
  )
}
