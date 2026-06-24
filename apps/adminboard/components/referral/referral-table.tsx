'use client'

import {
  DataTableBody,
  DataTableFooter,
  DataTableHeader,
} from '@virtality/ui/components/data-table'
import { PlusSquare } from 'lucide-react'
import { toast } from 'sonner'
import {
  useCreateReferralCode,
  useORPC,
  useReferralCodes,
} from '@virtality/react-query'
import { columns } from '@/components/referral/columns'
import { Button } from '@/components/ui/button'
import { useResourceTable } from '@virtality/ui/lib/use-resource-table'
import { getQueryClient } from '@/react-query'

const ReferralTable = () => {
  const orpc = useORPC()
  const { data, isPending } = useReferralCodes()
  const { mutate: createReferralCode, isPending: isGenerating } =
    useCreateReferralCode()
  const { table, globalFilter, setGlobalFilter } = useResourceTable({
    data: data ?? [],
    columns,
  })

  const handleGenerate = () => {
    createReferralCode(undefined, {
      onSuccess: () => {
        toast.success('Referral code generated successfully')
        return getQueryClient().invalidateQueries({
          queryKey: orpc.referral.list.key(),
        })
      },
      onError: (error) => {
        toast.error('Failed to generate referral code')
        console.error(error)
      },
    })
  }

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
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          <PlusSquare />
          {isGenerating ? 'Generating...' : 'Generate'}
        </Button>
      </DataTableHeader>
      <DataTableBody table={table} columns={columns} isLoading={isPending} />
      <DataTableFooter table={table} />
    </div>
  )
}

export default ReferralTable
