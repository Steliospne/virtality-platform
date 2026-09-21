'use client'

import { Button } from '@/components/ui/button'
import FilterBadge from '@/components/ui/filter-badge'
import {
  countActiveExerciseFilters,
  toggleExerciseValue,
  type ExerciseTableFilters as Filters,
} from '@/lib/exercise-table-filters'
import { X } from 'lucide-react'
import { ExerciseValueFilter } from './exercise-value-filter'

type ExerciseTableFiltersProps = {
  categories: string[]
  directions: string[]
  value: Filters
  onChange: (next: Filters) => void
  onReset: () => void
}

export const ExerciseTableFilters = ({
  categories,
  directions,
  value,
  onChange,
  onReset,
}: ExerciseTableFiltersProps) => {
  const activeCount = countActiveExerciseFilters(value)

  return (
    <div className='flex flex-wrap items-center gap-2'>
      <ExerciseValueFilter
        label='Category'
        options={categories}
        selected={value.categories}
        onToggle={(category) =>
          onChange({
            ...value,
            categories: toggleExerciseValue(value.categories, category),
          })
        }
        onClear={() => onChange({ ...value, categories: [] })}
      />
      <ExerciseValueFilter
        label='Direction'
        options={directions}
        selected={value.directions}
        onToggle={(direction) =>
          onChange({
            ...value,
            directions: toggleExerciseValue(value.directions, direction),
          })
        }
        onClear={() => onChange({ ...value, directions: [] })}
      />
      <FilterBadge
        name='new'
        checked={value.onlyNew}
        onClick={() => onChange({ ...value, onlyNew: !value.onlyNew })}
      />
      <FilterBadge
        name='enabled'
        checked={value.onlyEnabled}
        onClick={() => onChange({ ...value, onlyEnabled: !value.onlyEnabled })}
      />
      {activeCount > 0 ? (
        <Button type='button' variant='ghost' size='sm' onClick={onReset}>
          <X className='mr-1 size-3.5' />
          Reset
        </Button>
      ) : null}
    </div>
  )
}
