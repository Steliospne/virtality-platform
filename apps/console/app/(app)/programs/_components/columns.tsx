'use client'

import { Button } from '@virtality/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ColumnDef } from '@tanstack/react-table'
import { Archive, Copy, Ellipsis, Files, Pencil } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ColumnHeader from '@/components/tables/header-cell'
import DateCell from '@/components/tables/date-cell'
import { CompleteReusableProgram } from '@/types/models'
import {
  getQueryClient,
  useCopyReusableProgram,
  useORPC,
  useRetireReusableProgram,
} from '@virtality/react-query'
import {
  PROGRAM_RETIRE_CONFIRMATION,
  getProgramExerciseCount,
} from '@/lib/program-library'
import Link from 'next/link'

export const programLibraryColumns: ColumnDef<CompleteReusableProgram>[] = [
  {
    accessorKey: '#',
    cell: ({ cell }) => <div>{cell.row.index + 1}</div>,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column, header }) => (
      <ColumnHeader column={column} title={header.id} className='capitalize' />
    ),
  },
  {
    id: 'exerciseCount',
    accessorFn: (row) => getProgramExerciseCount(row),
    header: ({ column }) => (
      <ColumnHeader column={column} title='Exercises' className='capitalize' />
    ),
    cell: ({ row }) => <div>{getProgramExerciseCount(row.original)}</div>,
  },
  {
    accessorKey: 'updatedAt',
    header: ({ column, header }) => (
      <ColumnHeader
        column={column}
        title={header.id}
        className='*:capitalize'
      />
    ),
    cell: ({ row, column }) => <DateCell row={row} id={column.id} />,
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: function ActionCell({ row }) {
      const router = useRouter()
      const queryClient = getQueryClient()
      const orpc = useORPC()
      const program = row.original
      const [retireOpen, setRetireOpen] = useState(false)
      const { mutate: retireProgram, isPending } = useRetireReusableProgram({
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: orpc.reusableProgram.list.key(),
          })
          setRetireOpen(false)
        },
      })
      const { mutate: copyProgram, isPending: isCopyPending } =
        useCopyReusableProgram({
          onSuccess: (copiedProgram) => {
            queryClient.invalidateQueries({
              queryKey: orpc.reusableProgram.list.key(),
            })
            router.push(`/programs/${copiedProgram.id}/edit`)
          },
        })

      const copyId = () => {
        navigator.clipboard.writeText(program.id)
      }

      const handleMakeCopy = () => copyProgram({ id: program.id })

      const handleRetire = () => retireProgram({ id: program.id })

      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size='icon' variant='ghost' className='size-6'>
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent id='actions'>
              <DropdownMenuItem asChild>
                <Link href={`/programs/${program.id}/edit`}>
                  <Pencil />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={isCopyPending}
                onClick={handleMakeCopy}
              >
                <Files />
                Make a copy
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyId}>
                <Copy />
                Copy ID
              </DropdownMenuItem>
              <DropdownMenuItem
                variant='destructive'
                onClick={() => setRetireOpen(true)}
              >
                <Archive />
                Retire
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog open={retireOpen} onOpenChange={setRetireOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{PROGRAM_RETIRE_CONFIRMATION.title}</DialogTitle>
                <DialogDescription>
                  {PROGRAM_RETIRE_CONFIRMATION.description}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant='outline' onClick={() => setRetireOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant='destructive'
                  disabled={isPending}
                  onClick={handleRetire}
                >
                  Retire program
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )
    },
  },
]
