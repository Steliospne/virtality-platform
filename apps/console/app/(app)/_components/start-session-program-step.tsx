'use client'

import Link from 'next/link'
import { BookMarked, Zap } from 'lucide-react'
import { Badge } from '@virtality/ui/components/badge'
import type { HomeDashboardData } from './use-home-dashboard-data'
import { QUICK_START_PROGRAM_ID } from '@/lib/home-session-picker'
import StartSessionStep from './start-session-step'
import StartSessionOption from './start-session-option'
import type { StartSessionPicker } from './use-start-session-picker'

const SHORTLIST_SIZE = 3

const StartSessionProgramStep = ({
  programs,
  picker,
}: {
  programs: HomeDashboardData['programs']
  picker: StartSessionPicker
}) => {
  const { selection, selectProgram, lastProgramId } = picker

  // The last used program leads; the rest keep library order (most recently edited).
  const lastUsed = programs.find((program) => program.id === lastProgramId)
  const rows = [
    ...(lastUsed ? [lastUsed] : []),
    ...programs.filter((program) => program.id !== lastProgramId),
  ].slice(0, SHORTLIST_SIZE)

  return (
    <StartSessionStep
      number={2}
      label='Program'
      done={Boolean(selection.programId)}
      footer={
        <Link
          href='/programs'
          className='text-muted-foreground hover:text-foreground flex items-center gap-2 text-[13px]'
        >
          <BookMarked className='size-4' /> Program library
        </Link>
      }
    >
      {programs.length === 0 ? (
        <p className='text-muted-foreground text-[13px]'>
          No Reusable Programs yet. Quick Start builds the list on the fly.
        </p>
      ) : null}
      {rows.map((program) => (
        <StartSessionOption
          key={program.id}
          selected={selection.programId === program.id}
          onSelect={() => selectProgram(program.id)}
        >
          <div className='min-w-0 flex-1'>
            <div className='truncate'>{program.name}</div>
            <small className='text-muted-foreground block text-xs'>
              {program.exercises.length} exercise
              {program.exercises.length === 1 ? '' : 's'}
            </small>
          </div>
          {program.id === lastProgramId ? (
            <Badge
              variant='outline'
              className='border-vital-blue-100 bg-vital-blue-50 text-vital-blue-700 dark:border-vital-blue-500/20 dark:bg-vital-blue-500/10 dark:text-vital-blue-300'
            >
              Last used
            </Badge>
          ) : null}
        </StartSessionOption>
      ))}
      <StartSessionOption
        selected={selection.programId === QUICK_START_PROGRAM_ID}
        onSelect={() => selectProgram(QUICK_START_PROGRAM_ID)}
      >
        <div className='min-w-0 flex-1'>
          <div>Quick Start</div>
          <small className='text-muted-foreground block text-xs'>
            Build the list on the fly
          </small>
        </div>
        <Zap className='text-muted-foreground size-4' />
      </StartSessionOption>
    </StartSessionStep>
  )
}

export default StartSessionProgramStep
