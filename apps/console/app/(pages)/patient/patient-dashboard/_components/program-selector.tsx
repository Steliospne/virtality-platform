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
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import usePatient from '@/hooks/queries/patient/use-patient'
import usePatientPrograms from '@/hooks/queries/patient-program/use-patient-programs'

const ProgramSelector = ({ className }: { className?: string }) => {
  const { state, handler, store, patientLocalData, patientId } =
    usePatientDashboard()

  const { data: patient } = usePatient({ patientId })
  const { data: programs, isLoading: programsLoading } = usePatientPrograms({
    patientId,
  })
  const { selectedProgram, inQuickStart } = state
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
    updatePatientDashboardState({ selectedProgram: pickedProgram, exercises })
    setIsComboBoxOpen(!isComboBoxOpen)
  }

  const programSelectionClear = (e: MouseEvent) => {
    if (!patient) return
    e.stopPropagation()
    updatePatientDashboardState({ selectedProgram: null, exercises: [] })
    store?.delCell('patients', patient.id, 'lastProgram')
  }

  const quickStartHandler = () => {
    setInQuickStart(!inQuickStart)
  }

  return (
    <Popover open={isComboBoxOpen} onOpenChange={setIsComboBoxOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          className={cn(
            'hover:bg-card justify-between text-zinc-900 dark:border-zinc-600 dark:text-zinc-200',
            className,
          )}
        >
          {programsLoading ? (
            <Loader2 className='animate-spin' />
          ) : (
            <>
              <span className='min-w-5 overflow-hidden text-ellipsis'>
                {selectedProgram ? (
                  selectedProgram.name
                ) : (
                  <div className='flex items-center gap-2'>
                    <span>Select program</span>
                    <span>or</span>
                    <div
                      role='button'
                      onClick={quickStartHandler}
                      className='text-vital-blue-700 flex items-center justify-between hover:underline'
                    >
                      Quick start
                    </div>
                  </div>
                )}
              </span>
              <div className='flex items-center gap-2'>
                {selectedProgram && (
                  <div
                    role='button'
                    className='hover:bg-accent rounded p-0.5'
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

      <PopoverContent className='w-(--radix-popover-trigger-width) p-0 dark:border-zinc-600'>
        <Command>
          <CommandInput placeholder='Search program...' className='h-9' />
          <CommandList>
            <CommandEmpty>No program found.</CommandEmpty>
            <CommandGroup>
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
