'use client'

import { useMemo, useState } from 'react'
import { Button } from '@virtality/ui/components/button'
import { H2, P } from '@/components/ui/typography'
import { useClientT } from '@/i18n/use-client-t'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { useExercise, useStarterTemplates } from '@virtality/react-query'
import type { CompleteReusableProgram } from '@/types/models'
import { starterTemplateExerciseNamesForPreview } from '@/lib/starter-template-create'
import LoadingScreen from '@/components/ui/loading-screen'

interface StarterTemplatePickerProps {
  onCancel: () => void
  onBack: () => void
  onContinue: (template: CompleteReusableProgram) => void
}

const StarterTemplatePicker = ({
  onCancel,
  onBack,
  onContinue,
}: StarterTemplatePickerProps) => {
  const { t } = useClientT('common')
  const { data: templates, isLoading: isLoadingTemplates } =
    useStarterTemplates()
  const { data: exercises, isLoading: isLoadingExercises } = useExercise()
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  )

  const selectedTemplate = useMemo(
    () => templates?.find((template) => template.id === selectedTemplateId),
    [selectedTemplateId, templates],
  )

  const previewExerciseNames = useMemo(() => {
    if (!selectedTemplate || !exercises) return []

    return starterTemplateExerciseNamesForPreview(
      selectedTemplate.exercises,
      exercises,
    )
  }, [exercises, selectedTemplate])

  if (isLoadingTemplates || isLoadingExercises) {
    return (
      <div className='h-screen-with-nav container mx-auto flex flex-col gap-6 p-8'>
        <LoadingScreen />
      </div>
    )
  }

  return (
    <div className='h-screen-with-nav container mx-auto flex flex-col gap-6 p-8'>
      <div>
        <H2>Use a starter template</H2>
        <P>
          Browse curated exercise lists. Templates show included exercises only;
          you can adjust settings in the editor before saving your program.
        </P>
      </div>

      <div className='grid flex-1 gap-6 overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'>
        <Command className='border'>
          <CommandInput
            placeholder='Search starter templates...'
            className='h-9'
          />
          <CommandList>
            <CommandEmpty>No starter template found.</CommandEmpty>
            <CommandGroup heading='Starter templates'>
              {templates?.map((template) => (
                <CommandItem
                  key={template.id}
                  value={`${template.name} ${template.id}`}
                  onSelect={() => setSelectedTemplateId(template.id)}
                  className={
                    selectedTemplateId === template.id ? 'bg-accent' : undefined
                  }
                >
                  {template.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>

        <div className='flex flex-col gap-4 overflow-hidden rounded-md border p-4'>
          <div>
            <h3 className='text-lg font-medium'>Template preview</h3>
            <p className='text-muted-foreground text-sm'>
              Included exercises for the selected template.
            </p>
          </div>

          {selectedTemplate ? (
            <div className='flex min-h-0 flex-1 flex-col gap-3 overflow-auto'>
              <p className='font-medium'>{selectedTemplate.name}</p>
              {previewExerciseNames.length > 0 ? (
                <ul className='list-disc space-y-1 pl-5'>
                  {previewExerciseNames.map((name, index) => (
                    <li key={`${selectedTemplate.id}-${name}-${index}`}>
                      {name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className='text-muted-foreground text-sm'>
                  This template has no enabled exercises to preview.
                </p>
              )}
            </div>
          ) : (
            <p className='text-muted-foreground text-sm'>
              Select a starter template to preview its exercises.
            </p>
          )}
        </div>
      </div>

      <div className='flex justify-between'>
        <Button onClick={onCancel}>{t('btn.cancel')}</Button>
        <div className='flex gap-2'>
          <Button onClick={onBack}>{t('btn.back')}</Button>
          <Button
            variant='primary'
            disabled={!selectedTemplate}
            onClick={() => {
              if (selectedTemplate) onContinue(selectedTemplate)
            }}
          >
            Continue to editor
          </Button>
        </div>
      </div>
    </div>
  )
}

export default StarterTemplatePicker
