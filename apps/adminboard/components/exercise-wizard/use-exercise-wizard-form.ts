'use client'

import type { ExerciseDraftFields } from '@virtality/shared/types'
import { resetUnityStemFromDisplayName } from '@virtality/shared/utils'
import { useEffect, useState } from 'react'

export function useExerciseWizardForm(
  serverDraft: ExerciseDraftFields | undefined,
) {
  const [form, setForm] = useState<ExerciseDraftFields | null>(null)

  useEffect(() => {
    if (serverDraft) {
      setForm({ ...serverDraft })
    }
  }, [serverDraft])

  const patchForm = (patch: Partial<ExerciseDraftFields>) => {
    setForm((current) => (current ? { ...current, ...patch } : current))
  }

  const resetStemFromDisplayName = () => {
    setForm((current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        ...resetUnityStemFromDisplayName(current),
      }
    })
  }

  return {
    form,
    patchForm,
    resetStemFromDisplayName,
  }
}
