'use client'

import Link from 'next/link'
import { formatRelative } from 'date-fns'
import { PinOff, User } from 'lucide-react'
import { Button } from '@virtality/ui/components/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useSetPatientPinned } from '@virtality/react-query'
import type { PatientListItem } from '@/types/models'
import HomeSectionLabel from './home-section-label'
import PatientInitialsAvatar from './patient-initials-avatar'
import PinPatientPopover from './pin-patient-popover'

const PinnedPatientsCard = ({
  patients,
  isLoading,
}: {
  patients: PatientListItem[]
  isLoading: boolean
}) => {
  const setPinned = useSetPatientPinned()
  const pinned = patients
    .filter((patient) => patient.pinnedAt)
    .sort(
      (a, b) =>
        new Date(b.pinnedAt as Date).getTime() -
        new Date(a.pinnedAt as Date).getTime(),
    )
  const unpinned = patients.filter((patient) => !patient.pinnedAt)

  return (
    <section className='bg-card text-card-foreground flex flex-col gap-4 rounded-xl border p-6 shadow-sm'>
      <div className='flex items-center justify-between'>
        <HomeSectionLabel>Pinned patients</HomeSectionLabel>
        <User className='text-muted-foreground size-3.5' />
      </div>

      {isLoading ? (
        <div className='flex flex-col gap-3'>
          <Skeleton className='h-9' />
          <Skeleton className='h-9' />
        </div>
      ) : pinned.length === 0 ? (
        <p className='text-muted-foreground text-[13px]'>
          Pin the patients you see most often to keep them one click away.
        </p>
      ) : (
        <ul className='flex flex-col divide-y'>
          {pinned.map((patient) => (
            <li
              key={patient.id}
              className='group flex items-center gap-3 py-3 first:pt-0 last:pb-0'
            >
              <Link
                href={`/patients/${patient.id}/patient-dashboard`}
                className='flex min-w-0 flex-1 items-center gap-3'
              >
                <PatientInitialsAvatar
                  name={patient.name}
                  image={patient.image}
                />
                <div className='min-w-0 flex-1'>
                  <div className='truncate font-medium'>{patient.name}</div>
                  <small className='text-muted-foreground block truncate'>
                    {patient.lastSessionAt
                      ? formatRelative(
                          new Date(patient.lastSessionAt),
                          new Date(),
                        )
                      : 'No sessions yet'}
                    {patient.activeProgramName
                      ? ` · ${patient.activeProgramName}`
                      : ''}
                  </small>
                </div>
              </Link>
              <Button
                variant='ghost'
                size='icon-sm'
                aria-label={`Unpin ${patient.name}`}
                className='opacity-0 group-focus-within:opacity-100 group-hover:opacity-100'
                disabled={setPinned.isPending}
                onClick={() =>
                  setPinned.mutate({ id: patient.id, pinned: false })
                }
              >
                <PinOff />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <PinPatientPopover
        candidates={unpinned}
        disabled={isLoading || setPinned.isPending}
        onPin={(id) => setPinned.mutate({ id, pinned: true })}
      />
    </section>
  )
}

export default PinnedPatientsCard
