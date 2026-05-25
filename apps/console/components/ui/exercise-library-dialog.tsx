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
import { useState } from 'react'

const ExerciseLibraryDialog = () => {
  const { state, handler } = useExerciseLibrary()
  const { isLibraryOpen } = state
  const { setLibraryOpen } = handler
  const [gridKey, setGridKey] = useState(0)

  const [gridKey, setGridKey] = useState(0)
  const wasOpenRef = useRef(false)

  // Remount the grid whenever the library becomes open (including `setLibraryOpen(true)` from outside this dialog).
  useEffect(() => {
    if (isLibraryOpen && !wasOpenRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional remount counter tied to open transition
      setGridKey((k) => k + 1)
    }
    wasOpenRef.current = isLibraryOpen
  }, [isLibraryOpen])

  return (
    <Dialog
      open={isLibraryOpen}
      onOpenChange={(open) => {
        setLibraryOpen(open)
        if (open) setGridKey((k) => k + 1)
      }}
    >
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
