import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import HumanBack from '@/components/ui/human-back'
import HumanFront from '@/components/ui/human-front'
import { cn } from '@/lib/utils'
import { Slider } from '@/components/ui/slider'
import dynamic from 'next/dynamic'
import { useForm } from 'react-hook-form'
import { BodyAreas, MedHistoryDeltas, PatientForm } from '@/types/models'
import { useRef, useState } from 'react'
import { HumanState } from '@/data/static/human-body'
import useBeforeUnload from '@/hooks/use-before-unload'
import useNavigationGuard from '@/hooks/use-navigation-guard'

/** Compare by which parts are active; null and all-inactive are treated as equal. */
function bodyAreasHaveSameSelection(a: BodyAreas, b: BodyAreas): boolean {
  const activeKeys = (state: HumanState | null | undefined): Set<string> => {
    if (!state || typeof state !== 'object') return new Set()
    const set = new Set<string>()
    for (const [key, entry] of Object.entries(state)) {
      if (entry?.isActive === true) set.add(key)
    }
    return set
  }
  const frontA = activeKeys(a.front)
  const frontB = activeKeys(b.front)
  const backA = activeKeys(a.back)
  const backB = activeKeys(b.back)
  return (
    frontA.size === frontB.size &&
    [...frontA].every((k) => frontB.has(k)) &&
    backA.size === backB.size &&
    [...backA].every((k) => backB.has(k))
  )
}

const Editor = dynamic(() => import('@/editor'), {
  ssr: false,
  loading: () => <p>Loading...</p>,
})

interface MedicalHistoryProps {
  form: ReturnType<typeof useForm<PatientForm>>
  initialBodyAreas: BodyAreas
  bodyAreas: BodyAreas
  onBodyAreasChange?: (bodyAreas: BodyAreas) => void
  medHistoryDeltas: MedHistoryDeltas
}

const MedicalHistory = ({
  form,
  initialBodyAreas,
  bodyAreas,
  onBodyAreasChange,
  medHistoryDeltas,
}: MedicalHistoryProps) => {
  const {
    anamnesesDeltas,
    complaintsDeltas,
    diagnosisDeltas,
    expectationsDeltas,
  } = medHistoryDeltas

  const handleFrontChange = (front: HumanState) => {
    const next = { ...bodyAreas, front }
    onBodyAreasChange?.(next)
    setDirty(!bodyAreasHaveSameSelection(initialBodyAreas, next))
  }

  const handleBackChange = (back: HumanState) => {
    const next = { ...bodyAreas, back }
    onBodyAreasChange?.(next)
    setDirty(!bodyAreasHaveSameSelection(initialBodyAreas, next))
  }

  const quillRef = useRef(undefined)
  const [dirty, setDirty] = useState(false)
  useBeforeUnload(dirty)
  const { GuardDialog } = useNavigationGuard(dirty)

  return (
    <div className='flex flex-col gap-4 xl:grid xl:grid-cols-2'>
      <GuardDialog
        title='Unsaved changes'
        description='You have unsaved changes. Are you sure you want to leave this page?'
      />
      <div className='space-y-4'>
        <FormField
          name='anamneses'
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Anamneses</FormLabel>
              <FormControl>
                <Editor
                  {...field}
                  readOnly={false}
                  ref={quillRef}
                  deltasRef={anamnesesDeltas}
                  defaultValue={field.value ?? ''}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name='complaints'
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Patient’s Complaint</FormLabel>
              <FormControl>
                <Editor
                  {...field}
                  readOnly={false}
                  ref={quillRef}
                  deltasRef={complaintsDeltas}
                  defaultValue={field.value ?? ''}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name='expectations'
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Patient’s Expectations</FormLabel>
              <FormControl>
                <Editor
                  {...field}
                  readOnly={false}
                  ref={quillRef}
                  deltasRef={expectationsDeltas}
                  defaultValue={field.value ?? ''}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name='diagnosis'
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conclusion Diagnosis</FormLabel>
              <FormControl>
                <Editor
                  {...field}
                  readOnly={false}
                  ref={quillRef}
                  deltasRef={diagnosisDeltas}
                  defaultValue={field.value ?? ''}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name='nprs'
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>NPRS Pain Scale</FormLabel>
              <FormControl>
                <div>
                  <div
                    className={cn(
                      Number(field.value) > 7
                        ? 'text-red-500'
                        : Number(field.value) >= 5
                          ? 'text-orange-500'
                          : 'text-green-500',
                    )}
                  >
                    {field.value ?? 0}/10
                  </div>
                  <Slider
                    value={[Number(field.value) ?? 0]}
                    onValueChange={(value) => {
                      field.onChange(String(value[0]))
                    }}
                    max={10}
                    step={1}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className='flex'>
        <HumanFront value={bodyAreas.front} onSelect={handleFrontChange} />
        <HumanBack value={bodyAreas.back} onSelect={handleBackChange} />
      </div>
    </div>
  )
}

export default MedicalHistory
