'use client'
import { ColumnHeader } from '@/components/tables/header-cell'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import ExerciseInputPill from '@/components/ui/exercise-input-pill'
import useExerciseList from '@/hooks/use-exercise'
import { getDisplayName } from '@/lib/utils'
import { PresetExercise } from '@virtality/db'
import { ColumnDef } from '@tanstack/react-table'
import startCase from 'lodash.startcase'
import { Copy, Trash2 } from 'lucide-react'
import { useState } from 'react'

type PillValue = {
  name: string
  value: string
  id: string
}

export const columns: ColumnDef<PresetExercise>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: '#',
    cell: ({ cell }) => <div>{cell.row.index + 1}</div>,
    enableHiding: false,
  },
  {
    accessorKey: 'exerciseId',
    header: ({ column }) => (
      <ColumnHeader column={column} title={'Exercise Name'} />
    ),
    cell: function ExerciseCell({ cell }) {
      const { data, isPending } = useExerciseList()

      const id = cell.getValue()

      const exercise = data?.find((ex) => ex.id === id)
      if (isPending)
        return (
          <div>
            <p className='animate-pulse'>Loading ...</p>
          </div>
        )
      return <div>{getDisplayName(exercise)}</div>
    },
  },
  {
    accessorKey: 'optional',
    header: ({ header }) => <div>{startCase(header.id)}</div>,
  },
  {
    accessorKey: 'reps',
    header: ({ header }) => <div>{startCase(header.id)}</div>,
    cell: function SetCell({ cell, row, column: { id }, table }) {
      const [state, setState] = useState<PillValue>({
        name: '',
        value: '',
        id: '',
      })
      const initialValue = cell.getValue() as string
      const test = (target: PillValue) => {
        setState(target)
        table.options.meta?.updateData(row.index, id, target.value)
      }
      return (
        <ExerciseInputPill
          name='reps'
          id={'reps' + row.id}
          initialValue={state.value !== '' ? state.value : initialValue}
          onSetValue={test}
        />
      )
    },
  },
  {
    accessorKey: 'sets',
    header: ({ header }) => <div>{startCase(header.id)}</div>,
    cell: function SetCell({ cell, row, column: { id }, table }) {
      const [state, setState] = useState<PillValue>({
        name: '',
        value: '',
        id: '',
      })
      const initialValue = cell.getValue() as string
      const test = (target: PillValue) => {
        setState(target)
        table.options.meta?.updateData(row.index, id, target.value)
      }
      return (
        <ExerciseInputPill
          name='sets'
          id={'sets_' + row.id}
          initialValue={state.value !== '' ? state.value : initialValue}
          onSetValue={test}
        />
      )
    },
  },
  {
    accessorKey: 'restTime',
    header: ({ header }) => <div>{startCase(header.id) + '(sec)'}</div>,
    cell: function SetCell({ cell, row, column: { id }, table }) {
      const [state, setState] = useState<PillValue>({
        name: '',
        value: '',
        id: '',
      })
      const initialValue = cell.getValue() as string
      const test = (target: PillValue) => {
        setState(target)
        table.options.meta?.updateData(row.index, id, target.value)
      }
      return (
        <ExerciseInputPill
          name='restTime'
          id={'restTime_' + row.id}
          initialValue={state.value !== '' ? state.value : initialValue}
          onSetValue={test}
        />
      )
    },
  },
  {
    accessorKey: 'holdTime',
    header: ({ header }) => <div>{startCase(header.id) + '(sec)'}</div>,
    cell: function SetCell({ cell, row, column: { id }, table }) {
      const [state, setState] = useState<PillValue>({
        name: '',
        value: '',
        id: '',
      })
      const initialValue = cell.getValue() as string
      const test = (target: PillValue) => {
        setState(target)
        table.options.meta?.updateData(row.index, id, target.value)
      }
      return (
        <ExerciseInputPill
          name='holdTime'
          id={'holdTime_' + row.id}
          initialValue={state.value !== '' ? state.value : initialValue}
          onSetValue={test}
        />
      )
    },
  },
  {
    accessorKey: 'speed',
    header: ({ header }) => <div>{startCase(header.id) + '(sec)'}</div>,
    cell: function SetCell({ cell, row, column: { id }, table }) {
      const [state, setState] = useState<PillValue>({
        name: '',
        value: '',
        id: '',
      })
      const initialValue = cell.getValue() as string
      const test = (target: PillValue) => {
        setState(target)
        table.options.meta?.updateData(row.index, id, target.value)
      }
      return (
        <ExerciseInputPill
          name='speed'
          id={'speed_' + row.id}
          step={0.1}
          max={2}
          min={0}
          initialValue={state.value !== '' ? state.value : initialValue}
          onSetValue={test}
        />
      )
    },
  },
  {
    id: 'actions',
    cell: function ActionCell({ row, table }) {
      const preset = row.original
      const copyId = () => {
        navigator.clipboard.writeText(preset.exerciseId)
      }

      const handleDeleteAction = () =>
        table.options.meta?.deleteRow(preset.exerciseId)

      return (
        <div className='flex gap-2'>
          <Button variant='outline' size='icon' onClick={copyId}>
            <Copy />
          </Button>
          <Button
            variant='destructive'
            size='icon'
            onClick={handleDeleteAction}
          >
            <Trash2 />
          </Button>
        </div>
      )
    },
  },
]
