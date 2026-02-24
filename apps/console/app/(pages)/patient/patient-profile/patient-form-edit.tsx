'use client'
import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useForm } from 'react-hook-form'
import { PatientFormSchema } from '@/lib/definitions'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/form'
import {
  BodyAreas,
  MedHistoryDeltas,
  PatientForm as PatientFormType,
} from '@/types/models'
import { cn } from '@/lib/utils'
import useNavigationGuard from '@/hooks/use-navigation-guard'
import { toast } from 'react-toastify'
import { useClientT } from '@/i18n/use-client-t'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getQueryClient } from '@/integrations/tanstack-query/provider'
import BasicInfo from '../_components/basic-info'
import MedicalHistory from '../_components/medical-history-tab'
import useBeforeUnload from '@/hooks/use-before-unload'
import { MedicalHistory as MedicalHistoryType, Patient } from '@virtality/db'
import { useRouter } from 'next/navigation'
import useMounted from '@/hooks/use-mounted'
import usePatient from '@/hooks/queries/patient/use-patient'
import useMedicalHistory from '@/hooks/queries/use-medical-history'
import useDeletePatient from '@/hooks/mutations/patient/use-delete-patient'
import useUpdatePatient from '@/hooks/mutations/patient/use-update-patient'
import DeleteConfirmDialog from '@/components/ui/delete-confirm-dialog'
import SessionTab from './session-tab'
import { orpc } from '@/integrations/orpc/client'

const defaultValues: PatientFormType = {
  name: '',
  email: '',
  phone: '',
  height: '',
  weight: '',
  sex: '',
  dob: undefined,
  occupation: '',
  image: null,
  // medical history
  anamneses: '',
  complaints: '',
  expectations: '',
  diagnosis: '',
  nprs: '5',
}

interface PatientFormEditProps {
  patientId: string
}

const PatientFormEdit = ({ patientId }: PatientFormEditProps) => {
  const { queryClient } = getQueryClient()
  const { t } = useClientT(['common'])
  const mounted = useMounted()
  const router = useRouter()

  const { data: patient } = usePatient({ patientId })
  const { data: medHistory } = useMedicalHistory({ patientId })

  const [isDialogOpen, setDialogOpen] = useState(false)

  const values = {
    name: patient?.name ?? '',
    email: patient?.email ?? '',
    phone: patient?.phone ?? '',
    height: patient?.height ?? '',
    weight: patient?.weight ?? '',
    dob: patient?.dob ?? undefined,
    sex: patient?.sex ?? '',
    language: patient?.language ?? 'Greek',
    occupation: patient?.occupation ?? '',
    image: patient?.image ?? null,
    // medical history
    anamneses: medHistory?.anamneses ?? '',
    complaints: medHistory?.complaints ?? '',
    expectations: medHistory?.expectations ?? '',
    diagnosis: medHistory?.diagnosis ?? '',
    nprs: medHistory?.nprs ?? '5',
  }

  const deltas = medHistory?.deltas
    ? (JSON.parse(medHistory.deltas) as MedHistoryDeltas)
    : {
        anamnesesDeltas: null,
        complaintsDeltas: null,
        expectationsDeltas: null,
        diagnosisDeltas: null,
      }

  const initialBodyAreas = {
    front: medHistory?.bodyFront
      ? JSON.parse(medHistory.bodyFront as string)
      : null,
    back: medHistory?.bodyBack
      ? JSON.parse(medHistory.bodyBack as string)
      : null,
  }

  const [bodyAreas, setBodyAreas] = useState<BodyAreas>({
    front: null,
    back: null,
  })

  useEffect(() => {
    if (
      medHistory?.bodyFront !== undefined ||
      medHistory?.bodyBack !== undefined
    ) {
      setBodyAreas({
        front: medHistory?.bodyFront
          ? JSON.parse(medHistory.bodyFront as string)
          : null,
        back: medHistory?.bodyBack
          ? JSON.parse(medHistory.bodyBack as string)
          : null,
      })
    }
  }, [medHistory?.bodyFront, medHistory?.bodyBack])

  const submittedValues = useRef<PatientFormType | null>(null)

  const { mutate: updatePatient, isPending: isFormPending } = useUpdatePatient({
    onSuccess: async () => {
      return await Promise.all([
        queryClient.invalidateQueries({
          queryKey: orpc.patient.find.key(),
        }),
        queryClient.invalidateQueries({
          queryKey: orpc.medicalHistory.find.key(),
        }),
      ])
    },
  })

  const { mutate: deletePatient, isPending: isDeleting } = useDeletePatient({
    onSuccess: () => router.push('/patients'),
  })

  const form = useForm<PatientFormType>({
    resolver: zodResolver(PatientFormSchema),
    defaultValues,
    values,
  })

  const { errors, isSubmitSuccessful, isSubmitting, isDirty } = form.formState

  const onSubmit = (values: PatientFormType) => {
    if (!patient || !medHistory) return

    const {
      name,
      email,
      phone,
      dob,
      sex,
      weight,
      height,
      image,
      language,
      occupation,
      anamneses,
      complaints,
      diagnosis,
      expectations,
      nprs,
    } = values

    const patientData: Omit<
      Patient,
      'userId' | 'image' | 'id' | 'createdAt' | 'deletedAt'
    > & {
      image: File | string | null | undefined
    } = {
      name,
      email: email ?? null,
      phone: phone ?? null,
      dob: dob ?? null,
      sex: sex ?? null,
      weight: weight ?? null,
      height: height ?? null,
      image: image ?? null,
      language: language ?? 'Greek',
      occupation: occupation ?? null,
      updatedAt: new Date(),
    }

    const updatedPatient = {
      ...patient,
      ...patientData,
      id: patientId,
    }

    const medicalHistoryData: Partial<MedicalHistoryType> = {
      patientId,
      anamneses,
      complaints,
      diagnosis,
      expectations,
      nprs,
      deltas: JSON.stringify(deltas),
      bodyFront: bodyAreas.front ? JSON.stringify(bodyAreas.front) : null,
      bodyBack: bodyAreas.back ? JSON.stringify(bodyAreas.back) : null,
    }

    const updatedMedicalHistoryData = {
      ...medHistory,
      ...medicalHistoryData,
      id: medHistory.id,
      patientId: patientId,
    }

    submittedValues.current = values

    updatePatient({
      data: {
        patient: updatedPatient,
        medicalHistory: updatedMedicalHistoryData,
      },
    })
  }

  const handleDialogToggle = () => setDialogOpen(!isDialogOpen)

  const handleDelete = () => {
    if (!patient) return
    deletePatient(patient)
    handleDialogToggle()
  }

  const hasErrors = Object.keys(errors).length > 0 && Object.keys(errors).length

  useEffect(() => {
    if (!isFormPending && isSubmitSuccessful && submittedValues.current) {
      toast.success('Patient information saved.')
      form.reset(submittedValues.current, { keepDirty: false })
    }

    if (isSubmitting && hasErrors) {
      toast.error('Some required field are empty.')
    }
  }, [
    isFormPending,
    hasErrors,
    isSubmitSuccessful,
    isSubmitting,
    form,
    patient?.id,
  ])

  useBeforeUnload(isDirty)
  const { GuardDialog } = useNavigationGuard(isDirty)

  return (
    <div
      className={cn(
        'min-h-screen-with-nav relative flex flex-col gap-4 overflow-auto overflow-x-hidden bg-zinc-100 p-6 dark:bg-zinc-950',
      )}
    >
      <Tabs defaultValue='basic-info' className='flex-1'>
        <TabsList className='h-[50px] gap-2 bg-zinc-200 p-2'>
          <TabsTrigger value='basic-info' className='relative'>
            Basic Info
            {hasErrors && (
              <AlertCircle className='text-red-500 dark:text-red-700' />
            )}
          </TabsTrigger>
          <TabsTrigger value='medical-history'>Medical History</TabsTrigger>
          <TabsTrigger value='sessions'>Sessions</TabsTrigger>
        </TabsList>
        <Form {...form}>
          <form
            id='patient-form'
            // eslint-disable-next-line react-hooks/refs
            onSubmit={form.handleSubmit(onSubmit)}
            className='max-h-[73svh] overflow-auto'
          >
            {/* Basic Info */}
            <TabsContent value='basic-info' className='flex flex-col pr-2'>
              {mounted && patient && (
                <BasicInfo form={form} patient={patient} />
              )}
            </TabsContent>

            {/* Medical History */}
            <TabsContent
              value='medical-history'
              className='mx-auto space-y-4 pr-2'
            >
              <MedicalHistory
                form={form}
                medHistoryDeltas={deltas}
                initialBodyAreas={initialBodyAreas}
                bodyAreas={bodyAreas}
                onBodyAreasChange={setBodyAreas}
              />
            </TabsContent>
          </form>
        </Form>

        <TabsContent value='sessions' className='flex flex-col'>
          <SessionTab patientId={patientId} />
        </TabsContent>
      </Tabs>

      <Separator />

      {/* Action Buttons */}

      {mounted && (
        <div className='flex justify-end space-x-4'>
          <DeleteConfirmDialog
            title='Delete Patient'
            description={
              <>
                Are you sure you want to delete <strong>{patient?.name}</strong>
                ? This action cannot be undone.
              </>
            }
            onConfirm={handleDelete}
            asChild
          >
            <Button variant='destructive' onClick={handleDialogToggle}>
              {isDeleting ? (
                <Loader2 className='animate-spin' />
              ) : (
                t('btn.delete')
              )}
            </Button>
          </DeleteConfirmDialog>

          <Button type='submit' form='patient-form' variant='primary'>
            {isFormPending ? (
              <Loader2 className='animate-spin' />
            ) : (
              t('btn.update')
            )}
          </Button>
        </div>
      )}

      {/* Unsaved changes confirmation dialog (from hook) */}
      <GuardDialog
        title='Unsaved changes'
        description='You have unsaved changes. Are you sure you want to leave this page?'
      />
    </div>
  )
}

export default PatientFormEdit
