'use client'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FormTextarea } from '@/components/ui/form-v2'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { SessionNotesSchema, SessionNotes } from '@virtality/shared/types'
import { Save } from 'lucide-react'
import { usePatientDashboard } from '@/context/patient-dashboard-context'
import useUpdatePatientSession from '@/hooks/mutations/patient-session/use-update-patient-session'
import usePatientSession from '@/hooks/queries/patient-session/use-patient-session'

const SessionNotesCard = () => {
  const { state, patientSessionId } = usePatientDashboard()
  const { programState } = state

  const { data: patientSession, refetch } = usePatientSession({
    sessionId: patientSessionId.current,
  })

  const form = useForm({
    resolver: zodResolver(SessionNotesSchema),
    defaultValues: { notes: '' },
  })

  const { mutate: updatePatientSession, isPending } = useUpdatePatientSession({
    onSuccess: () => refetch(),
  })

  const onSubmit = (values: SessionNotes) => {
    if (!patientSession) return

    updatePatientSession({ id: patientSessionId.current, notes: values.notes })
  }

  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>Session Notes</CardTitle>
      </CardHeader>
      <CardContent className='flex-1'>
        <form
          id='sessionNotes'
          onSubmit={form.handleSubmit(onSubmit)}
          className='h-full'
        >
          <FormTextarea
            name='notes'
            label='Notes'
            control={form.control}
            disabled={programState === 'ready'}
            className='h-full [&_#notes]:h-full [&_#notes]:resize-none'
          />
        </form>
      </CardContent>
      <CardFooter className='justify-end'>
        <Button
          form='sessionNotes'
          disabled={programState === 'ready' || isPending}
        >
          <Save /> {isPending ? 'Saving...' : 'Save'}
        </Button>
      </CardFooter>
    </Card>
  )
}

export default SessionNotesCard
