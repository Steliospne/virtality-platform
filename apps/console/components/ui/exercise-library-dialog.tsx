import { useState } from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import ExerciseGrid from '@/components/ui/exercise-grid'
import { Button } from '@/components/ui/button'
import { useExerciseLibrary } from '@/context/exercise-library-context'

const ExerciseLibraryDialog = () => {
  const { state, handler } = useExerciseLibrary()
  const { isLibraryOpen } = state
  const { setLibraryOpen } = handler
  const [gridKey, setGridKey] = useState(0)

  const handleOpenChange = (open: boolean) => {
    setLibraryOpen(open)
    if (open) setGridKey((k) => k + 1)
  }

  return (
    <Dialog open={isLibraryOpen} onOpenChange={handleOpenChange}>
      <DialogContent className='z-1000 grid h-full max-h-[calc(100svh-40px)] min-h-0 max-w-[calc(100svw-40px)]! grid-rows-[auto_minmax(0,1fr)_auto]'>
        <DialogHeader>
          <DialogTitle>Exercise Library</DialogTitle>
        </DialogHeader>
        <ExerciseGrid key={gridKey} />
        <DialogFooter>
          <DialogClose asChild>
            <Button>Confirm</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ExerciseLibraryDialog
