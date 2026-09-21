import {
  EMPTY_EMAIL_AUDIENCE_FORM,
  isEmailAudienceFormDirty,
  toEmailAudienceForm,
  toEmailAudienceInput,
  type EmailAudienceFormSource,
  type EmailAudienceFormState,
} from '@/lib/email-audience-form'
import { getErrorMessage } from '@/lib/get-error-message'
import {
  useCreateEmailAudience,
  useDeleteEmailAudience,
  usePreviewEmailAudience,
  useUpdateEmailAudience,
} from '@virtality/react-query'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

type SavedAudience = EmailAudienceFormSource & {
  id: string
  updatedAt: string | Date
  attachedDraftCount: number
}

type UseEmailAudienceEditorInput = {
  /** Null when composing a new Audience. */
  audience: SavedAudience | null
  onSaved: (audienceId: string) => void
  onDeleted: () => void
}

export const useEmailAudienceEditor = ({
  audience,
  onSaved,
  onDeleted,
}: UseEmailAudienceEditorInput) => {
  const saved = useMemo(
    () =>
      audience ? toEmailAudienceForm(audience) : EMPTY_EMAIL_AUDIENCE_FORM,
    [audience],
  )
  const [form, setForm] = useState<EmailAudienceFormState>(saved)

  useEffect(() => {
    setForm(saved)
  }, [saved])

  const createMutation = useCreateEmailAudience()
  const updateMutation = useUpdateEmailAudience()
  const deleteMutation = useDeleteEmailAudience()
  const previewMutation = usePreviewEmailAudience()

  const isDirty = isEmailAudienceFormDirty(form, saved)
  const isSaving = createMutation.isPending || updateMutation.isPending

  const patch = (update: Partial<EmailAudienceFormState>) =>
    setForm((current) => ({ ...current, ...update }))

  const save = async () => {
    const input = toEmailAudienceInput(form)
    try {
      const result = audience
        ? await updateMutation.mutateAsync({
            audienceId: audience.id,
            ...input,
          })
        : await createMutation.mutateAsync(input)
      toast.success(audience ? 'Audience saved' : 'Audience created')
      onSaved(result.id)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to save audience'))
    }
  }

  const remove = async () => {
    if (!audience) return
    try {
      await deleteMutation.mutateAsync({ audienceId: audience.id })
      toast.success('Audience deleted')
      onDeleted()
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to delete audience'))
    }
  }

  const preview = async () => {
    try {
      await previewMutation.mutateAsync(toEmailAudienceInput(form))
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to evaluate audience'))
    }
  }

  return {
    form,
    patch,
    isDirty,
    isSaving,
    isDeleting: deleteMutation.isPending,
    save,
    remove,
    preview,
    previewInput: toEmailAudienceInput(form),
    previewResult: previewMutation.data ?? null,
    isPreviewing: previewMutation.isPending,
  }
}
