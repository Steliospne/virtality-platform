'use client'
import {
  DataTableBody,
  DataTableFooter,
  DataTableHeader,
} from '@/components/tables/data-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import useExerciseList from '@/hooks/use-exercise'
import { getDisplayName, getUUID } from '@/lib/utils'
import { PresetExercise } from '@virtality/db'
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  RowData,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table'
import uniq from 'lodash.uniq'
import { Info, PlusCircle, PlusSquare } from 'lucide-react'
import { Fragment, SetStateAction, useMemo, useState } from 'react'

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void
    deleteRow: (exerciseId: string) => void
  }
}

interface PresetExerciseTableProps {
  columns: ColumnDef<PresetExercise>[]
  data?: PresetExercise[]
  setData?: (value: SetStateAction<PresetExercise[]>) => void
  className?: string
}

const PresetExerciseTable = ({
  data,
  setData,
  columns,
  className,
}: PresetExerciseTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const table = useReactTable({
    data: data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      globalFilter,
      rowSelection,
      columnVisibility,
    },
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    meta: {
      updateData: (rowIndex, columnId, value) => {
        setData?.((old) =>
          old.map((row, index) => {
            if (index === rowIndex) {
              return {
                ...old[rowIndex]!,
                [columnId]: value,
              }
            }
            return row
          }),
        )
      },
      deleteRow: (exerciseId: string) => {
        setData?.(data?.filter((ex) => ex.exerciseId !== exerciseId) ?? [])
      },
    },
  })

  const { data: exerciseList } = useExerciseList()

  const categories = useMemo(() => {
    return (
      uniq(
        exerciseList
          ?.sort((a, b) => a.category!.localeCompare(b.category!))
          .map((e) => e.category),
      ) ?? []
    )
  }, [exerciseList])

  return (
    <Card className={className}>
      <CardContent className='flex flex-1 flex-col'>
        <DataTableHeader
          table={table}
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
        >
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <PlusSquare />
                Exercise
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-fit!'>
              <DialogHeader>
                <DialogTitle></DialogTitle>
              </DialogHeader>
              <DialogDescription></DialogDescription>
              <Tabs defaultValue={categories[0]}>
                {categories.map((category) => (
                  <Fragment key={category}>
                    <TabsList>
                      <TabsTrigger value={category}>{category}</TabsTrigger>
                    </TabsList>
                    <TabsContent value={category} className='border p-2'>
                      <ul className='max-h-[75svh] space-y-1 overflow-auto'>
                        {exerciseList
                          ?.filter((ex) => ex.category === category)
                          ?.filter(
                            (obj1) =>
                              !data?.some(
                                (obj2) => obj1.id === obj2.exerciseId,
                              ),
                          )
                          ?.map((ex) => (
                            <li
                              key={ex.id}
                              className='hover:bg-muted-foreground/20 rounded-lg p-2'
                            >
                              <div className='flex items-center gap-2'>
                                <Info className='size-4' />
                                <p>{getDisplayName(ex)}</p>
                                <div className='ml-auto cursor-pointer'>
                                  <PlusCircle
                                    className='size-4'
                                    onClick={() => {
                                      if (data && setData) {
                                        setData?.([
                                          ...data,
                                          {
                                            id: getUUID(),
                                            presetId: data[0].presetId,
                                            exerciseId: ex.id,
                                            optional: false,
                                            sets: 3,
                                            reps: 10,
                                            restTime: 0.5,
                                            holdTime: 1,
                                            speed: 1,
                                          },
                                        ])
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                            </li>
                          ))}
                      </ul>
                    </TabsContent>
                  </Fragment>
                ))}
              </Tabs>

              <DialogFooter>
                <DialogClose asChild>
                  <Button>Confirm</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </DataTableHeader>
        <DataTableBody table={table} columns={columns} className='flex-1' />
        <DataTableFooter table={table} />
      </CardContent>
    </Card>
  )
}

export default PresetExerciseTable
