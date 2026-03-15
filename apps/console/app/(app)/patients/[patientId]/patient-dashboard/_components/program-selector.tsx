'use client'
import { useState, MouseEvent } from 'react'
import { usePatientDashboard } from '@/context/patient-dashboard-context'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { Check, ChevronsUpDown, Dumbbell, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePatient, usePatientPrograms } from '@virtality/react-query'
import { withRom } from '@/lib/with-rom'

const ProgramSelector = ({ className }: { className?: string }) => {
  const { state, handler, store, patientLocalData, patientId } =
    usePatientDashboard()

  const { data: patient } = usePatient({ patientId })
  const { data: programs, isLoading: programsLoading } = usePatientPrograms({
    patientId,
  })
  const { selectedProgram, inQuickStart, activeExerciseData } = state
  const { updatePatientDashboardState, setInQuickStart } = handler

  const [isComboBoxOpen, setIsComboBoxOpen] = useState(false)

  const programSelect = (programId: string) => {
    const pickedProgram =
      programs?.find((program) => program.id === programId) ?? null

    if (!pickedProgram || !patient) return

    const { programExercise: exercises } = pickedProgram
    store?.setRow('patients', patient.id, {
      ...patientLocalData,
      lastProgram: pickedProgram.id,
    })

    const firstExercise = exercises[0]

    updatePatientDashboardState({
      selectedProgram: pickedProgram,
      exercises: withRom(exercises),
      activeExerciseData: {
        ...activeExerciseData,
        id: firstExercise ? firstExercise.exerciseId : null,
        totalReps: firstExercise ? firstExercise.reps : 0,
        totalSets: firstExercise ? firstExercise.sets : 0,
      },
    })

    setIsComboBoxOpen(!isComboBoxOpen)
  }

  const programSelectionClear = (e: MouseEvent) => {
    if (!patient) return
    e.stopPropagation()
    updatePatientDashboardState({
      selectedProgram: null,
      exercises: [],
      activeExerciseData: {
        id: null,
        currentRep: 0,
        currentSet: 0,
        totalReps: 0,
        totalSets: 0,
      },
    })
    store?.delCell('patients', patient.id, 'lastProgram')
  }

  const quickStartHandler = () => {
    if (!patient) return
    updatePatientDashboardState({
      selectedProgram: null,
      exercises: [],
      activeExerciseData: {
        id: null,
        currentRep: 0,
        currentSet: 0,
        totalReps: 0,
        totalSets: 0,
      },
    })
    store?.delCell('patients', patient.id, 'lastProgram')
    setInQuickStart(!inQuickStart)
  }

  return (
    <Popover open={isComboBoxOpen} onOpenChange={setIsComboBoxOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          className={cn(
            'hover:bg-card justify-start text-zinc-900 md:max-lg:w-[204px]! dark:border-zinc-600 dark:text-zinc-200',
            className,
          )}
        >
          {programsLoading ? (
            <Loader2 className='animate-spin' />
          ) : (
            <>
              <Dumbbell />
              <span className='min-w-5 overflow-hidden text-ellipsis max-md:hidden'>
                {selectedProgram ? (
                  selectedProgram.name
                ) : (
                  <SelectionOptions quickStartHandler={quickStartHandler} />
                )}
              </span>
              <div className='flex flex-1 items-center justify-end gap-2'>
                {selectedProgram && (
                  <div
                    role='button'
                    className='hover:bg-accent rounded p-0.5 max-md:hidden'
                    onClick={programSelectionClear}
                  >
                    <X />
                  </div>
                )}

                <ChevronsUpDown className='opacity-50' />
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className='p-0 dark:border-zinc-600'>
        <Command>
          <CommandInput placeholder='Search program...' className='h-9' />
          <CommandList>
            <CommandEmpty>No program found.</CommandEmpty>
            <CommandGroup>
              <CommandItem>
                <SelectionOptions
                  quickStartHandler={quickStartHandler}
                  onlyQuickStart
                />
              </CommandItem>
              {programs?.map((program) => (
                <CommandItem
                  key={program.id}
                  value={program.id}
                  onSelect={programSelect}
                >
                  {program.name}
                  <Check
                    className={cn(
                      'ml-auto',
                      selectedProgram?.id === program.id
                        ? 'opacity-100'
                        : 'opacity-0',
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default ProgramSelector

function SelectionOptions({
  quickStartHandler,
  className,
  onlyQuickStart,
}: {
  quickStartHandler: () => void
  className?: string
  onlyQuickStart?: boolean
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {!onlyQuickStart && <span>Select program</span>}
      {!onlyQuickStart && <span>or</span>}
      <div
        role='button'
        onClick={quickStartHandler}
        className='text-vital-blue-700 flex items-center justify-between hover:underline'
      >
        Quick start
      </div>
    </div>
  )
}
