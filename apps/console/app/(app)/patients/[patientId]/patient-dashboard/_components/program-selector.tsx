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
import { Button } from '@virtality/ui/components/button'
import { Check, ChevronsUpDown, Dumbbell, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePatient, useReusablePrograms } from '@virtality/react-query'
import {
  buildProgramSelectionState,
  orderProgramsForDashboardSelection,
} from '@/lib/patient-dashboard-program-selection'

const ProgramSelector = ({ className }: { className?: string }) => {
  const { state, handler, store, patientLocalData, patientId } =
    usePatientDashboard()

  const { data: patient } = usePatient({ patientId })
  const { data: programs, isLoading: programsLoading } = useReusablePrograms()
  const { selectedProgram, inQuickStart, activeExerciseData } = state
  const { updatePatientDashboardState, setInQuickStart } = handler

  const [isComboBoxOpen, setIsComboBoxOpen] = useState(false)

  const orderedPrograms = orderProgramsForDashboardSelection(
    programs ?? [],
    patientLocalData.lastProgram,
  )

  const programSelect = (programId: string) => {
    const pickedProgram =
      programs?.find((program) => program.id === programId) ?? null

    if (!pickedProgram || !patient) return

    store?.setRow('patients', patient.id, {
      ...patientLocalData,
      lastProgram: pickedProgram.id,
    })

    updatePatientDashboardState(
      buildProgramSelectionState(pickedProgram, activeExerciseData),
    )

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
              {orderedPrograms.map((program) => (
                <CommandItem
                  key={program.id}
                  value={program.name}
                  onSelect={() => programSelect(program.id)}
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
      {!onlyQuickStart && (
        <span className='md:max-lg:hidden'>Select program</span>
      )}
      {!onlyQuickStart && <span className='md:max-lg:hidden'>or</span>}
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
