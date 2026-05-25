'use client'

import { useEffect, useRef, useState } from 'react'
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
  const wasOpenRef = useRef(false)

  useEffect(() => {
    if (isLibraryOpen && !wasOpenRef.current) {
      setGridKey((k) => k + 1)
    }
    wasOpenRef.current = isLibraryOpen
  }, [isLibraryOpen])

  return (
    <Dialog open={isLibraryOpen} onOpenChange={setLibraryOpen}>
      <DialogContent className='z-1000 grid h-full max-h-[calc(100svh-40px)] max-w-[calc(100svw-40px)]! min-h-0 grid-rows-[auto_minmax(0,1fr)_auto]'>
        <DialogHeader>
          <DialogTitle>Exercise Library</DialogTitle>
        </DialogHeader>
        <ExerciseGrid key={gridKey} />
        <DialogFooter className='self'>
          <DialogClose asChild>
            <Button>Confirm</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ExerciseLibraryDialog
