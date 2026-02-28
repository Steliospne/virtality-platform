import { MoreHorizontal } from 'lucide-react'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import UploadResource from './UploadResource'
import { useContext, useState } from 'react'
import { TableContext } from './ui/data-table'

const ActionsDropDown = ({
  id,
  rowIndex,
  typeName,
}: {
  id: string | number
  rowIndex: number
  typeName: string
}) => {
  const tableContext = useContext(TableContext)
  const [open, setOpen] = useState(false)
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      {' '}
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='h-8 w-8 p-0'>
          <span className='sr-only'>Open menu</span>
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuLabel>Upload Image</DropdownMenuLabel>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <UploadResource
            rowId={String(id)}
            rowIndex={rowIndex}
            typeName={typeName}
            onImageUploaded={(imageUrl, rowIndex) => {
              setOpen(false)
              tableContext?.handleImageUpdate?.(imageUrl, rowIndex)
            }}
          />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ActionsDropDown
