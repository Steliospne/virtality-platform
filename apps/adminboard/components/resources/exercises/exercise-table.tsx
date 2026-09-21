'use client'

import {
  DataTableBody,
  DataTableFooter,
  DataTableHeader,
} from '@virtality/ui/components/data-table'
import { PlusSquare } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useExercise } from '@virtality/react-query'
import { ExerciseDraftList } from '@/components/resources/exercises/exercise-draft-list'
import { ExerciseTableFilters } from '@/components/resources/exercises/exercise-table-filters'
import { Button } from '@/components/ui/button'
import { columns } from '@/components/resources/exercises/columns'
import { EXERCISE_WIZARD_CREATE_PATH } from '@/lib/exercise-wizard-constants'
import {
  buildExerciseColumnFilters,
  EMPTY_EXERCISE_TABLE_FILTERS,
  listExerciseValues,
  type ExerciseTableFilters as Filters,
} from '@/lib/exercise-table-filters'
import { useResourceTable } from '@virtality/ui/lib/use-resource-table'

const ExerciseTable = () => {
  const { data, isPending } = useExercise({ includeDisabled: true })
  const [filters, setFilters] = useState<Filters>(EMPTY_EXERCISE_TABLE_FILTERS)
  const { table, globalFilter, setGlobalFilter, setColumnFilters } =
    useResourceTable({
      tableId: 'exercises',
      data: data ?? [],
      columns,
      enableColumnFilters: true,
    })

  const categories = useMemo(
    () => listExerciseValues(data ?? [], 'category'),
    [data],
  )
  const directions = useMemo(
    () => listExerciseValues(data ?? [], 'direction'),
    [data],
  )

  const applyFilters = (next: Filters) => {
    setFilters(next)
    setColumnFilters(buildExerciseColumnFilters(next))
  }

  return (
    <div className='p-8'>
      <ExerciseDraftList />
      <DataTableHeader
        table={table}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        filters={
          <ExerciseTableFilters
            categories={categories}
            directions={directions}
            value={filters}
            onChange={applyFilters}
            onReset={() => applyFilters(EMPTY_EXERCISE_TABLE_FILTERS)}
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
