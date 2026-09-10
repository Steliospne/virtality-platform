import type {
  ExerciseDraftFields,
  SaveExerciseDraftInput,
} from '@virtality/shared/types'

export function exerciseDraftToSaveInput(
  draft: ExerciseDraftFields,
): SaveExerciseDraftInput {
  return {
    id: draft.id,
    laterality: draft.laterality,
    displayName: draft.displayName,
    unityStem: draft.unityStem,
    unityStemDirty: draft.unityStemDirty,
    description: draft.description,
    category: draft.category,
    item: draft.item,
    image: draft.image,
    video: draft.video,
  }
}

export function formatExerciseDraftOccupancyError(
  occupiedNames: string[],
): string {
  if (occupiedNames.length === 1) {
    return `Unity name ${occupiedNames[0]} is already in use.`
  }

  return `Unity names ${occupiedNames.join(', ')} are already in use.`
}
