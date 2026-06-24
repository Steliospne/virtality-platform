'use client'

import {
  DataTableBody,
  DataTableFooter,
  DataTableHeader,
} from '@virtality/ui/components/data-table'
import { useState } from 'react'
import { useExercise } from '@virtality/react-query'
import FilterBadge from '@/components/ui/filter-badge'
import { columns } from '@/components/resources/exercises/columns'
import { useResourceTable } from '@virtality/ui/lib/use-resource-table'

const ExerciseTable = () => {
  const { data, isPending } = useExercise({ includeDisabled: true })
  const [enabledFilter, setEnabledFilter] = useState(false)
  const { table, globalFilter, setGlobalFilter, setColumnFilters } =
    useResourceTable({
      data: data ?? [],
      columns,
      enableColumnFilters: true,
    })

  const handleEnabledFilter = () => {
    setEnabledFilter(!enabledFilter)
    setColumnFilters([{ id: 'enabled', value: enabledFilter ? true : false }])
  }

  return (
    <div className='p-8'>
      <DataTableHeader
        table={table}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        filters={
          <FilterBadge
            name='enabled'
            checked={enabledFilter}
            onClick={handleEnabledFilter}
          />
        }
      />
      <DataTableBody table={table} columns={columns} isLoading={isPending} />
      <DataTableFooter table={table} />
    </div>
  )
}

export default ExerciseTable
