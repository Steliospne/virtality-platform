import { Button } from '@virtality/ui/components/button'
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
  PatientSessionSchema,
  PatientSessionForm,
} from '@virtality/shared/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Textarea } from '@virtality/ui/components/textarea'
import { Input } from '@virtality/ui/components/input'
import {
  getQueryClient,
  useCreateSupplementalTherapyRelMutation,
  useSupplementalTherapyQuery,
  usePatientSession,
  useDeletePatientSession,
  useORPC,
  useCompleteSession,
  useReusableProgram,
} from '@virtality/react-query'
import { trackAnalyticsEvent } from '@/lib/analytics-contract'
import { useEffect, useState } from 'react'
import { SessionCompletionSaveChoice } from '@virtality/shared/utils'
import { generateUUID } from '@virtality/shared/utils'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@virtality/ui/components/label'
import {
  buildInitialSessionCompletionDialogState,
  buildSessionCompletionPayload,
  canShowUpdateSourceProgramOption,
} from '@/lib/session-completion-dialog'

const SessionDialog = () => {
  const queryClient = getQueryClient()
  const orpc = useORPC()
  const { state, handler, patientId } = usePatientDashboard()
  const { isDialogOpen, completionSessionId, exercises } = state
  const { setDialogOpen, updatePatientDashboardState } = handler
  const { data: supplementalTherapies } = useSupplementalTherapyQuery()
  const { data: patientSessionData } = usePatientSession({
    sessionId: completionSessionId ?? undefined,
  })
  const { data: sourceProgram } = useReusableProgram({
    id: patientSessionData?.sourceReusableProgramId ?? undefined,
  })

  const [completionState, setCompletionState] = useState(
    buildInitialSessionCompletionDialogState(null),
  )

  useEffect(() => {
    if (!isDialogOpen) return

    setCompletionState(
      buildInitialSessionCompletionDialogState(
        patientSessionData?.sourceProgramName,
      ),
    )
  }, [isDialogOpen, patientSessionData?.sourceProgramName])

  const showUpdateSourceProgram = canShowUpdateSourceProgramOption(
    {
      sourceReusableProgramId:
        patientSessionData?.sourceReusableProgramId ?? null,
      sourceProgramName: patientSessionData?.sourceProgramName ?? null,
    },
    sourceProgram,
  )

  const { mutateAsync: completeSession } = useCompleteSession({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orpc.patientSession.list.queryKey({
          input: { where: { patientId } },
        }),
      })
      queryClient.invalidateQueries({
        queryKey: orpc.reusableProgram.list.key(),
      })
    },
  })

  const { mutateAsync: createSupplementalTherapyRel } =
    useCreateSupplementalTherapyRelMutation({
      onSuccess: (_, variables) => {
        trackAnalyticsEvent('supplemental_therapy_selected', {
          session_id: completionSessionId ?? '',
          therapy_count: variables.methods?.length ?? 0,
          includes_other: !!variables.otherEnabled,
        })
      },
    })

  const { mutate: deletePatientSession } = useDeletePatientSession({
    onSuccess: () => {
      trackAnalyticsEvent('session_deleted_without_save', {
        session_id: completionSessionId ?? '',
      })
    },
  })

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
    values: {
      notes: patientSessionData?.notes ?? '',
    },
  })

  const closeDialog = () => {
    updatePatientDashboardState({
      isDialogOpen: false,
      completionSessionId: null,
    })
    form.reset()
  }

  const onSubmit = async (
    values: PatientSessionForm & { notes?: string | null },
  ) => {
    if (!completionSessionId) return

    if (
      completionState.saveChoice ===
        SessionCompletionSaveChoice.UPDATE_SOURCE_PROGRAM &&
      !completionState.showUpdateConfirmation
    ) {
      setCompletionState((current) => ({
        ...current,
        showUpdateConfirmation: true,
      }))
      return
    }

    const payload = buildSessionCompletionPayload({
      sessionId: completionSessionId,
      saveChoice: completionState.saveChoice,
      newProgramName: completionState.newProgramName,
      notes: values.notes,
      workingCopy: exercises,
      persistedRows:
        patientSessionData?.sessionExercise?.map((exercise) => ({
          id: exercise.id,
          exerciseId: exercise.exerciseId,
        })) ?? [],
      createId: generateUUID,
    })

    await completeSession(payload)
    await createSupplementalTherapyRel({
      ...values,
      patientSessionId: completionSessionId,
    })

    trackAnalyticsEvent('session_notes_saved', {
      session_id: completionSessionId,
      notes_length: values.notes?.length ?? 0,
    })

    closeDialog()
  }

  const handleDeletePatientSession = () => {
    if (!completionSessionId) return

    closeDialog()
    deletePatientSession({ id: completionSessionId })
  }

  const handleClicksOutsideDialog = (
    e: CustomEvent<{
      originalEvent: PointerEvent
    }>,
  ) => {
    e.preventDefault()
  }

  const saveChoice = completionState.saveChoice

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        if (!open) closeDialog()
        else setDialogOpen(open)
      }}
    >
      <form id='session-completion-form' onSubmit={form.handleSubmit(onSubmit)}>
        <DialogContent onPointerDownOutside={handleClicksOutsideDialog}>
          <DialogHeader>
            <DialogTitle>Session Completed</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Choose how to save this session and any supplemental therapies used
            outside VR.
          </DialogDescription>

          <div className='space-y-4'>
            <div className='space-y-3'>
              <p className='text-sm font-medium'>Program Library</p>
              <RadioGroup
                value={saveChoice}
                onValueChange={(value) =>
                  setCompletionState((current) => ({
                    ...current,
                    saveChoice: value as SessionCompletionSaveChoice,
                    showUpdateConfirmation: false,
                  }))
                }
              >
                <div className='flex items-start gap-3'>
                  <RadioGroupItem
                    value={SessionCompletionSaveChoice.FINISH_ONLY}
                    id='finish-only'
                  />
                  <Label htmlFor='finish-only' className='font-normal'>
                    Finish session only
                  </Label>
                </div>

                {showUpdateSourceProgram && (
                  <div className='flex items-start gap-3'>
                    <RadioGroupItem
                      value={SessionCompletionSaveChoice.UPDATE_SOURCE_PROGRAM}
                      id='update-source-program'
                    />
                    <Label
                      htmlFor='update-source-program'
                      className='font-normal'
                    >
                      Update this program
                      {patientSessionData?.sourceProgramName
                        ? ` (${patientSessionData.sourceProgramName})`
                        : ''}
                    </Label>
                  </div>
                )}

                <div className='flex items-start gap-3'>
                  <RadioGroupItem
                    value={SessionCompletionSaveChoice.SAVE_AS_NEW_PROGRAM}
                    id='save-as-new-program'
                  />
                  <Label htmlFor='save-as-new-program' className='font-normal'>
                    Save as new program
                  </Label>
                </div>
              </RadioGroup>

              {saveChoice ===
                SessionCompletionSaveChoice.SAVE_AS_NEW_PROGRAM && (
                <div className='space-y-2'>
                  <Label htmlFor='new-program-name'>Program name</Label>
                  <Input
                    id='new-program-name'
                    value={completionState.newProgramName}
                    onChange={(event) =>
                      setCompletionState((current) => ({
                        ...current,
                        newProgramName: event.target.value,
                      }))
                    }
                  />
                </div>
              )}

              {saveChoice ===
                SessionCompletionSaveChoice.UPDATE_SOURCE_PROGRAM &&
                completionState.showUpdateConfirmation && (
                  <p className='text-muted-foreground text-sm'>
                    This will overwrite the exercises and settings in your
                    Program Library program. Past sessions stay unchanged.
                  </p>
                )}
            </div>

            <div className='space-y-2'>
              <p className='text-sm font-medium'>Supplemental therapies</p>
              {supplementalTherapies?.map((method) => (
                <FormCheckbox
                  key={method.id}
                  control={form.control}
                  label={
                    <span className='capitalize'>
                      {method.name.replaceAll('_', ' ')}
                    </span>
                  }
                  // eslint-disable-next-line react-hooks/incompatible-library
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
                value={form.watch('notes') ?? ''}
                onChange={(e) => form.setValue('notes', e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='destructive'
              onClick={handleDeletePatientSession}
            >
              {"Don't Save"}
            </Button>
            <Button form='session-completion-form' variant='default'>
              {saveChoice ===
                SessionCompletionSaveChoice.UPDATE_SOURCE_PROGRAM &&
              !completionState.showUpdateConfirmation
                ? 'Continue'
                : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  )
}

export default SessionDialog
