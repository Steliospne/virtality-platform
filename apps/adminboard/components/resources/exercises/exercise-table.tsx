'use client'

import {
  DataTableBody,
  DataTableFooter,
  DataTableHeader,
} from '@virtality/ui/components/data-table'
import { PlusSquare } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useExercise } from '@virtality/react-query'
import { ExerciseDraftList } from '@/components/resources/exercises/exercise-draft-list'
import FilterBadge from '@/components/ui/filter-badge'
import { Button } from '@/components/ui/button'
import { columns } from '@/components/resources/exercises/columns'
import { EXERCISE_WIZARD_CREATE_PATH } from '@/lib/exercise-wizard-constants'
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
      <ExerciseDraftList />
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
      >
        <Button asChild variant='primary' className='ml-auto flex items-center'>
          <Link
            href={EXERCISE_WIZARD_CREATE_PATH}
            data-testid='create-exercise-link'
          >
            <PlusSquare />
            Create exercise
          </Link>
        </Button>
      </DataTableHeader>
      <DataTableBody table={table} columns={columns} isLoading={isPending} />
      <DataTableFooter table={table} />
    </div>
  )
}

export default ExerciseTable
