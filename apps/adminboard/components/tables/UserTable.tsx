'use client'
import { User } from '@virtality/db'
import { generateColumns } from '../GenerateColumns'
import { DataTable } from '../ui/data-table'
import { updateUsers } from '@/lib/actions/userActions'

export const UserTable = ({ data }: { data: User[] }) => {
  const fallbackKeys: (keyof User)[] = [
    'id',
    'name',
    'email',
    'phoneNumber',
    'image',
    'createdAt',
    'updatedAt',
    'role',
    'emailVerified',
    'stripeCustomerId',
    'banned',
    'banReason',
    'banExpires',
  ]

  const keys: (keyof User)[] =
    data.length > 0 ? (Object.keys(data[0]) as (keyof User)[]) : fallbackKeys

  const columns = generateColumns<User>(keys as (keyof User)[], 'User')
  return (
    <div className='mx-auto'>
      <DataTable columns={columns} data={data} updateAction={updateUsers} />
    </div>
  )
}
