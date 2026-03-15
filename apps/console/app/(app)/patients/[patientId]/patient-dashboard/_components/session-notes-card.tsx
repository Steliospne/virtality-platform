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
import { cn } from '@/lib/utils'
import {
  getQueryClient,
  useORPC,
  useUpdatePatientSession,
} from '@virtality/react-query'
import { trackAnalyticsEvent } from '@/lib/analytics-contract'

interface SessionNotesCardProps {
  className?: string
}

const SessionNotesCard = ({ className }: SessionNotesCardProps) => {
  const queryClient = getQueryClient()
  const orpc = useORPC()
  const { state, patientSessionId, patientId } = usePatientDashboard()
  const { programState } = state

  const form = useForm({
    resolver: zodResolver(SessionNotesSchema),
    defaultValues: { notes: '' },
  })

  const { mutate: updatePatientSession, isPending } = useUpdatePatientSession({
    onSuccess: (_, variables) => {
      trackAnalyticsEvent('session_notes_saved', {
        session_id: variables.id!,
        notes_length: variables.notes?.length ?? 0,
      })

      return Promise.all([
        queryClient.invalidateQueries({
          queryKey: orpc.patientSession.list.key({
            input: { where: { patientId } },
          }),
        }),
        queryClient.invalidateQueries({
          queryKey: orpc.patientSession.find.key({
            input: { where: { id: patientSessionId.current } },
          }),
        }),
      ])
    },
  })

  const onSubmit = (values: SessionNotes) => {
    if (!patientSessionId.current) return
    updatePatientSession({ id: patientSessionId.current, notes: values.notes })
  }

  return (
    <Card className={cn('h-full', className)}>
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
