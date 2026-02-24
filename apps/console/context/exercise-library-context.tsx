'use client'
import { createContext, useContext, ReactNode } from 'react'
import useExerciseLibraryState, {
  useExerciseLibraryStateType,
} from '@/hooks/use-exercise-library-state'

export type ExerciseLibraryContextValue = {
  state: useExerciseLibraryStateType['state']
  handler: useExerciseLibraryStateType['handler']
}

const ExerciseLibraryContext =
  createContext<ExerciseLibraryContextValue | null>(null)

interface ExerciseLibraryProviderProps {
  children: ReactNode
}

export const ExerciseLibraryProvider = ({
  children,
}: ExerciseLibraryProviderProps) => {
  const { state, handler } = useExerciseLibraryState({})

  return (
    <ExerciseLibraryContext.Provider value={{ state, handler }}>
      {children}
    </ExerciseLibraryContext.Provider>
  )
}

export const useExerciseLibrary = (): ExerciseLibraryContextValue => {
  const ctx = useContext(ExerciseLibraryContext)
  if (!ctx)
    throw new Error(
      'useExerciseLibrary must be used within ExerciseLibraryProvider',
    )
  return ctx
}

export const useExerciseLibraryOptional =
  (): ExerciseLibraryContextValue | null => {
    return useContext(ExerciseLibraryContext)
  }

export default ExerciseLibraryContext
