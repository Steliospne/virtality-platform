'use client'
import { useEffect, useState } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useForm } from 'react-hook-form'
import { PatientFormSchema } from '@/lib/definitions'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/form'
import { BodyAreas, PatientForm as PatientFormType } from '@/types/models'
import Link from 'next/link'
import { getUUID } from '@/lib/utils'
import useNavigationGuard from '@/hooks/use-navigation-guard'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { useClientT } from '@/i18n/use-client-t'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getQueryClient } from '@/integrations/tanstack-query/provider'
import BasicInfo from '../_components/basic-info'
import MedicalHistory from '../_components/medical-history-tab'
import useBeforeUnload from '@/hooks/use-before-unload'
import { MedicalHistory as MedicalHistoryType, Patient } from '@virtality/db'
import useMounted from '@/hooks/use-mounted'
import useNewPatient from '@/hooks/mutations/patient/use-new-patient'
import useIsAuthed from '@/hooks/use-is-authed'
import { orpc } from '@/integrations/orpc/client'

const defaultValues: PatientFormType = {
  name: '',
  email: '',
  phone: '',
  height: '',
  weight: '',
  sex: '',
  dob: undefined,
  language: 'Greek',
  occupation: '',
  image: null,
  // medical history
  anamneses: '',
  complaints: '',
  expectations: '',
  diagnosis: '',
  nprs: '5',
}

const PatientForm = () => {
  useIsAuthed()
  const { queryClient } = getQueryClient()
  const mounted = useMounted()
  const router = useRouter()

  const medHistoryDeltas = {
    anamnesesDeltas: null,
    complaintsDeltas: null,
    expectationsDeltas: null,
    diagnosisDeltas: null,
  }

  const { mutate: createPatient, isPending: isFormPending } = useNewPatient({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orpc.patient.list.key(),
      })

      router.push('/patients')
    },
  })

  const { t } = useClientT(['common'])

  const form = useForm<PatientFormType>({
    resolver: zodResolver(PatientFormSchema),
    defaultValues,
  })

  const onSubmit = (values: PatientFormType) => {
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

    const patientData: Omit<Patient, 'userId' | 'image'> & {
      image: File | string | null | undefined
    } = {
      id: getUUID(),
      name,
      email: email ?? null,
      phone: phone ?? null,
      dob: dob ?? null,
      sex: sex ?? null,
      weight: weight ?? null,
      height: height ?? null,
      image: image,
      language: language ?? 'Greek',
      occupation: occupation ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    }

    const medicalHistoryData: MedicalHistoryType = {
      id: getUUID(),
      patientId: patientData!.id,
      anamneses,
      complaints,
      diagnosis,
      expectations,
      nprs,
      deltas: JSON.stringify(medHistoryDeltas),
      bodyFront: bodyAreas.front ? JSON.stringify(bodyAreas.front) : null,
      bodyBack: bodyAreas.back ? JSON.stringify(bodyAreas.back) : null,
    }

    createPatient({
      data: { patient: patientData, medicalHistory: medicalHistoryData },
    })
  }

  const initialBodyAreas: BodyAreas = {
    front: null,
    back: null,
  }

  const [bodyAreas, setBodyAreas] = useState<BodyAreas>(initialBodyAreas)

  const { errors, isSubmitting, isDirty } = form.formState

  const hasErrors = Object.keys(errors).length > 0 && Object.keys(errors).length

  useEffect(() => {
    if (isSubmitting && hasErrors) {
      toast.error('Some required field are empty.')
    }
  }, [isSubmitting, hasErrors])

  useBeforeUnload(isDirty)
  const { GuardDialog } = useNavigationGuard(isDirty)

  return (
    <div className='h-screen-with-header relative flex flex-col gap-4 overflow-auto overflow-x-hidden bg-zinc-100 p-6 dark:bg-zinc-950'>
      <Tabs defaultValue='basic-info' className='flex-1'>
        <TabsList className='h-[50px] gap-2 bg-zinc-200 p-2'>
          <TabsTrigger value='basic-info' className='relative'>
            Basic Info
            {hasErrors && (
              <AlertCircle className='text-red-500 dark:text-red-700' />
            )}
          </TabsTrigger>
          <TabsTrigger value='medical-history'>Medical History</TabsTrigger>
        </TabsList>
        <Form {...form}>
          <form
            id='patient-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='max-h-[77svh] overflow-auto'
          >
            {/* Basic Info */}
            <TabsContent
              value='basic-info'
              className='flex h-full flex-col pr-2'
            >
              {mounted && <BasicInfo form={form} />}
            </TabsContent>

            {/* Medical History */}
            <TabsContent
              value='medical-history'
              className='mx-auto space-y-4 pr-2'
            >
              <MedicalHistory
                form={form}
                medHistoryDeltas={medHistoryDeltas}
                initialBodyAreas={initialBodyAreas}
                bodyAreas={bodyAreas}
                onBodyAreasChange={setBodyAreas}
              />
            </TabsContent>
          </form>
        </Form>
      </Tabs>

      <Separator />

      {/* Action Buttons */}
      {mounted && (
        <div className='flex justify-end space-x-4'>
          <Button asChild type='button' variant='outline'>
            <Link href='/patients'>{t('btn.cancel')}</Link>
          </Button>

          <Button type='submit' form='patient-form' variant='primary'>
            {isFormPending ? (
              <Loader2 className='animate-spin' />
            ) : (
              t('btn.create')
            )}
          </Button>
        </div>
      )}

      {/* Unsaved changes confirmation dialog (from hook) */}
      {
        <GuardDialog
          title='Unsaved changes'
          description='You have unsaved changes. Are you sure you want to leave this page?'
        />
      }
    </div>
  )
}

export default PatientForm
