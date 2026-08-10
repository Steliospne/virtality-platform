'use client'

import {
  DataTableBody,
  DataTableFooter,
  DataTableHeader,
} from '@virtality/ui/components/data-table'
import { PlusSquare } from 'lucide-react'
import { toast } from 'sonner'
import {
  useCreateTesterCode,
  useORPC,
  useTesterCodes,
} from '@virtality/react-query'
import { columns } from '@/components/tester-code/columns'
import { Button } from '@/components/ui/button'
import { useResourceTable } from '@virtality/ui/lib/use-resource-table'
import { getQueryClient } from '@/react-query'

const TesterCodeTable = () => {
  const orpc = useORPC()
  const { data, isPending } = useTesterCodes()
  const { mutate: createTesterCode, isPending: isGenerating } =
    useCreateTesterCode()
  const { table, globalFilter, setGlobalFilter } = useResourceTable({
    data: data ?? [],
    columns,
  })

  const handleGenerate = () => {
    createTesterCode(undefined, {
      onSuccess: () => {
        toast.success('Tester code generated successfully')
        return getQueryClient().invalidateQueries({
          queryKey: orpc.testerCode.list.key(),
        })
      },
      onError: (error) => {
        toast.error('Failed to generate tester code')
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

export default TesterCodeTable
