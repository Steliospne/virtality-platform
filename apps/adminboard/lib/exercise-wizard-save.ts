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
    exerciseId: draft.exerciseId,
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

export function formatExerciseDraftExerciseIdOccupancyError(
  occupiedExerciseIds: string[],
): string {
  if (occupiedExerciseIds.length === 1) {
    return `Exercise ID ${occupiedExerciseIds[0]} is already in use.`
  }

  return `Exercise IDs ${occupiedExerciseIds.join(', ')} are already in use.`
}

export function formatExerciseDraftOccupancyError(
  occupiedNames: string[],
): string {
  if (occupiedNames.length === 1) {
    return `Unity name ${occupiedNames[0]} is already in use.`
  }

  return `Unity names ${occupiedNames.join(', ')} are already in use.`
}
