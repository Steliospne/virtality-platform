'use client'

import { tableDefaults } from '@/tanstack-tables'
import {
  ColumnDef,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import {
  DataTableBody,
  DataTableFooter,
  DataTableHeader,
} from '@/components/tables/data-table'
import useBucket from '@/hooks/use-bucket'
import { columns } from './columns'
import useMounted from '@/hooks/use-mounted'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { type Image as ImageType } from '@/types/models'
import { Image as ImageIcon } from 'lucide-react'
import { deleteFileAction, createImage } from '@/lib/actions/generalActions'
import { useMutation } from '@tanstack/react-query'
import { getQueryClient } from '@/react-query'
import { Spinner } from '../ui/spinner'
import { FormFileInput } from '../ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ImageUploadForm } from '@/types/definitions'
import { z } from 'zod/v4'
import Image from 'next/image'
import placeholder from '@/public/placeholder.svg'

const BucketTableDAL = () => {
  const mounted = useMounted()
  const { data } = useBucket()

  return mounted && data && <BucketTable data={data} columns={columns} />
}

interface BucketTableProps {
  columns: ColumnDef<ImageType>[]
  data: ImageType[]
}

const BucketTable = ({ data, columns }: BucketTableProps) => {
  const queryClient = getQueryClient()
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const table = useReactTable({
    data,
    columns,
    ...tableDefaults.models,
    state: {
      sorting,
      globalFilter,
      rowSelection,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
  })

  const { mutate: removeImage, isPending: removeImagePending } = useMutation({
    mutationFn: (key: string) => deleteFileAction(key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bucket'] })
    },
  })

  const handleDeleteSelected = () => {
    const keys = Object.keys(rowSelection)

    data.forEach((item, index) => {
      if (keys.includes(index.toString())) {
        removeImage(item.key!)
        table.resetRowSelection()
      }
    })
  }

  const hasSelected = useMemo(
    () => Object.keys(rowSelection).length > 0,
    [rowSelection],
  )

  const form = useForm({
    resolver: zodResolver(ImageUploadForm),
    defaultValues: { image: '' },
  })

  const onSubmit = (values: z.infer<typeof ImageUploadForm>) => {
    if (values.image instanceof File) {
      createImage(values.image, undefined, { defaultName: true })
    }
  }

  const [imagePreview, setImagePreview] = useState('')

  return (
    <div className='p-8'>
      <DataTableHeader
        table={table}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
      >
        {hasSelected && (
          <Button variant='destructive' onClick={handleDeleteSelected}>
            {removeImagePending ? <Spinner /> : 'Delete Selected'}
          </Button>
        )}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant='primary' className='ml-auto'>
              Upload
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>
                <ImageIcon /> Upload an Image
              </DialogTitle>
              <DialogDescription>General image upload form.</DialogDescription>
            </DialogHeader>
            <div>
              <Image
                alt='Upload image preview.'
                src={imagePreview || placeholder}
                width={100}
                height={100}
                className='h-auto'
              />
            </div>
            <form id='fileForm' onSubmit={form.handleSubmit(onSubmit)}>
              <FormFileInput
                name='image'
                control={form.control}
                label='Image'
                onChange={setImagePreview}
              />
            </form>
            <DialogFooter>
              <Button variant='primary' form='fileForm'>
                Submit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DataTableHeader>
      <DataTableBody table={table} columns={columns} />
      <DataTableFooter table={table} />
    </div>
  )
}

export default BucketTableDAL
