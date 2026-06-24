'use client'

import {
  DataTableBody,
  DataTableFooter,
  DataTableHeader,
} from '@virtality/ui/components/data-table'
import { useRouter } from 'next/navigation'
import { usePresets } from '@virtality/react-query/legacy'
import { columns } from '@/app/resources/preset/columns'
import { useResourceTable } from '@virtality/ui/lib/use-resource-table'
import PresetPopover from './preset-popover'

const PresetTable = () => {
  const router = useRouter()
  const { data, isPending } = usePresets()
  const { table, globalFilter, setGlobalFilter } = useResourceTable({
    data: data ?? [],
    columns,
  })

  const rowNavigation = (id: string) => {
    router.push(`/resources/preset/${id}`)
  }

  return (
    <div className='p-8'>
      <DataTableHeader
        table={table}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
      >
        <PresetPopover />
      </DataTableHeader>
      <DataTableBody
        table={table}
        columns={columns}
        rowNavigation={rowNavigation}
        isLoading={isPending}
      />
      <DataTableFooter table={table} />
    </div>
  )
}

export default PresetTable
