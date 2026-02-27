import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { usePatientDashboard } from '@/context/patient-dashboard-context'
import { FormCheckbox, FormInput } from '@/components/ui/form-v2'
import {
  useCreateSupplementalTherapyRelMutation,
  useSupplementalTherapyQuery,
} from '@/hooks/queries/use-supplemental-therapy'
import {
  PatientSessionSchema,
  PatientSessionForm,
} from '@virtality/shared/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import useCompleteSession from '@/hooks/mutations/patient-session/use-complete-session'
import { z } from 'zod'
import useUpdatePatientSession from '@/hooks/mutations/patient-session/use-update-patient-session'
import usePatientSession from '@/hooks/queries/patient-session/use-patient-session'
import { Textarea } from '@/components/ui/textarea'
import useDeletePatientSession from '@/hooks/mutations/patient-session/use-delete-patient-session'
import { orpc } from '@/integrations/orpc/client'
import { getQueryClient } from '@/integrations/tanstack-query/provider'

const SessionDialog = () => {
  const { state, handler, patientSessionId, patientId } = usePatientDashboard()
  const { isDialogOpen } = state
  const { setDialogOpen } = handler
  const { queryClient } = getQueryClient()
  const { data: supplementalTherapies } = useSupplementalTherapyQuery()
  const { data: patientSessionData } = usePatientSession({
    sessionId: patientSessionId.current,
  })

  const { mutateAsync: completeSession } = useCompleteSession({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orpc.patientSession.list.queryKey({
          input: { where: { patientId } },
        }),
      })
    },
  })

  const { mutateAsync: createSupplementalTherapyRel } =
    useCreateSupplementalTherapyRelMutation({})
  const { mutate: deletePatientSession } = useDeletePatientSession({})
  const { mutateAsync: updatePatientSession } = useUpdatePatientSession({})

  const form = useForm({
    resolver: zodResolver(
      PatientSessionSchema.extend({ notes: z.string().optional().nullable() }),
    ),
    defaultValues: {
      methods: [],
      otherEnabled: false,
      otherText: '',
      notes: '',
    },
  })

  const onSubmit = async (
    values: PatientSessionForm & { notes?: string | null },
  ) => {
    await completeSession({ id: patientSessionId.current })
    await createSupplementalTherapyRel({
      ...values,
      patientSessionId: patientSessionId.current,
    })
    await updatePatientSession({
      id: patientSessionId.current,
      notes: values.notes,
    })

    patientSessionId.current = ''
    form.reset()
    setDialogOpen(!isDialogOpen)
  }

  const handleDeletePatientSession = () => {
    if (setDialogOpen) setDialogOpen(!isDialogOpen)
    deletePatientSession({ id: patientSessionId.current })
    patientSessionId.current = ''
  }

  const handleClicksOutsideDialog = (
    e: CustomEvent<{
      originalEvent: PointerEvent
    }>,
  ) => {
    e.preventDefault()
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
      <form id='test' onSubmit={form.handleSubmit(onSubmit)}>
        <DialogContent onPointerDownOutside={handleClicksOutsideDialog}>
          <DialogHeader>
            <DialogTitle>Session Completed</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Select therapies used in the session other than VR
          </DialogDescription>
          <div className='space-y-2'>
            {supplementalTherapies?.map((method) => (
              <FormCheckbox
                key={method.id}
                control={form.control}
                label={
                  <span className='capitalize'>
                    {method.name.replaceAll('_', ' ')}
                  </span>
                }
                checked={form.watch('methods')?.includes(method.id)}
                onCheckedChange={(value) => {
                  const current = form.getValues('methods') ?? []

                  form.setValue(
                    'methods',
                    value
                      ? [...current, method.id]
                      : current?.filter((id) => id !== method.id),
                  )
                }}
                name={method.name as keyof PatientSessionForm}
              />
            ))}
            <FormCheckbox
              label={'Other'}
              name={'otherEnabled'}
              control={form.control}
            />

            {form.watch('otherEnabled') && (
              <FormInput
                key={'other'}
                control={form.control}
                label={<span className='hidden'>{'otherText'}</span>}
                name={'otherText'}
                placeholder={'Other therapy used...'}
              />
            )}

            <Textarea
              value={patientSessionData?.notes ?? ''}
              onChange={(e) => form.setValue('notes', e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant='destructive' onClick={handleDeletePatientSession}>
              {"Don't Save"}
            </Button>
            <Button form='test' variant='default'>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  )
}

export default SessionDialog
