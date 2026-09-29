'use client'

import Link from 'next/link'
import { formatRelative } from 'date-fns'
import { Plus, Search } from 'lucide-react'
import { Input } from '@virtality/ui/components/input'
import type { PatientListItem } from '@/types/models'
import { filterPatientsBySearch } from '@/lib/patient-list'
import StartSessionStep from './start-session-step'
import StartSessionOption from './start-session-option'
import PatientInitialsAvatar from './patient-initials-avatar'
import type { StartSessionPicker } from './use-start-session-picker'

const SHORTLIST_SIZE = 3

function shortlist(
  patients: PatientListItem[],
  query: string,
  selectedId: string | null,
): PatientListItem[] {
  const matches = filterPatientsBySearch(patients, query)
  if (query.trim()) return matches.slice(0, SHORTLIST_SIZE)

  const byRecent = [...matches].sort(
    (a, b) =>
      (b.lastSessionAt ? new Date(b.lastSessionAt).getTime() : 0) -
      (a.lastSessionAt ? new Date(a.lastSessionAt).getTime() : 0),
  )
  const selected = byRecent.find((p) => p.id === selectedId)
  const rest = byRecent.filter((p) => p.id !== selectedId)
  return [...(selected ? [selected] : []), ...rest].slice(0, SHORTLIST_SIZE)
}

const StartSessionPatientStep = ({
  patients,
  picker,
}: {
  patients: PatientListItem[]
  picker: StartSessionPicker
}) => {
  const { selection, patientQuery, setPatientQuery, selectPatient } = picker
  const rows = shortlist(patients, patientQuery, selection.patientId)

  return (
    <StartSessionStep
      number={1}
      label='Patient'
      done={Boolean(selection.patientId)}
      footer={
        <Link
          href='/patients/new'
          className='text-muted-foreground hover:text-foreground flex items-center gap-2 text-[13px]'
        >
          <Plus className='size-4' /> New patient
        </Link>
      }
    >
      {patients.length > SHORTLIST_SIZE ? (
        <div className='relative'>
          <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2' />
          <Input
            value={patientQuery}
            onChange={(event) => setPatientQuery(event.target.value)}
            placeholder='Search patients…'
            aria-label='Search patients'
            className='pl-8'
          />
        </div>
      ) : null}
      {patients.length === 0 ? (
        <p className='text-muted-foreground text-[13px]'>
          No patients yet. Add your first one to start a session.
        </p>
      ) : rows.length === 0 ? (
        <p className='text-muted-foreground text-[13px]'>No patient matches.</p>
      ) : (
        rows.map((patient) => (
          <StartSessionOption
            key={patient.id}
            selected={selection.patientId === patient.id}
            onSelect={() => selectPatient(patient.id)}
          >
            <PatientInitialsAvatar
              name={patient.name}
              image={patient.image}
              className='size-7 text-[11px]'
            />
            <div className='min-w-0 flex-1'>
              <div className='truncate'>{patient.name}</div>
              <small className='text-muted-foreground block truncate text-xs'>
                {patient.lastSessionAt
                  ? formatRelative(new Date(patient.lastSessionAt), new Date())
                  : 'No sessions yet'}
                {patient.activeProgramName
                  ? ` · ${patient.activeProgramName}`
                  : ''}
              </small>
            </div>
          </StartSessionOption>
        ))
      )}
    </StartSessionStep>
  )
}

export default StartSessionPatientStep
