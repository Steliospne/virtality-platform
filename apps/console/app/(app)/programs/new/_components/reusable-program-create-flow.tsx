'use client'

import { useState } from 'react'
import { Button } from '@virtality/ui/components/button'
import { H2, P } from '@/components/ui/typography'
import { useClientT } from '@/i18n/use-client-t'
import { useRouter } from 'next/navigation'
import { ExerciseLibraryProvider } from '@/context/exercise-library-context'
import type { CompleteReusableProgram } from '@/types/models'
import ReusableProgramFormView from './reusable-program-form'
import StarterTemplatePicker from './starter-template-picker'

type CreateStep = 'choice' | 'template-picker' | 'editor'

type EditorSource =
  | { kind: 'scratch' }
  | { kind: 'template'; template: CompleteReusableProgram }

const ReusableProgramCreateFlow = () => {
  const router = useRouter()
  const { t } = useClientT('common')
  const [step, setStep] = useState<CreateStep>('choice')
  const [editorSource, setEditorSource] = useState<EditorSource | null>(null)

  const handleCancel = () => router.push('/programs')

  if (step === 'choice') {
    return (
      <div className='h-screen-with-nav container mx-auto flex flex-col gap-6 p-8'>
        <div>
          <H2>Create program</H2>
          <P>
            Start from scratch or use a starter template. Either path opens the
            program editor before anything is saved to your library.
          </P>
        </div>

        <div className='grid gap-4 md:grid-cols-2'>
          <button
            type='button'
            className='hover:bg-accent flex flex-col gap-2 rounded-lg border p-6 text-left transition-colors'
            onClick={() => {
              setEditorSource({ kind: 'scratch' })
              setStep('editor')
            }}
          >
            <span className='text-lg font-medium'>Create your own program</span>
            <span className='text-muted-foreground text-sm'>
              Build a reusable program from the exercise library with standard
              default settings.
            </span>
          </button>

          <button
            type='button'
            className='hover:bg-accent flex flex-col gap-2 rounded-lg border p-6 text-left transition-colors'
            onClick={() => setStep('template-picker')}
          >
            <span className='text-lg font-medium'>Use a starter template</span>
            <span className='text-muted-foreground text-sm'>
              Begin from a curated exercise list, then review and edit before
              saving to your Program Library.
            </span>
          </button>
        </div>

        <div>
          <Button onClick={handleCancel}>{t('btn.cancel')}</Button>
        </div>
      </div>
    )
  }

  if (step === 'template-picker') {
    return (
      <StarterTemplatePicker
        onCancel={handleCancel}
        onBack={() => setStep('choice')}
        onContinue={(template) => {
          setEditorSource({ kind: 'template', template })
          setStep('editor')
        }}
      />
    )
  }

  if (step === 'editor' && editorSource) {
    return (
      <ExerciseLibraryProvider>
        <ReusableProgramFormView
          editorSource={editorSource}
          onBack={() => {
            if (editorSource.kind === 'template') {
              setStep('template-picker')
              return
            }
            setStep('choice')
          }}
        />
      </ExerciseLibraryProvider>
    )
  }

  return null
}

export default ReusableProgramCreateFlow
