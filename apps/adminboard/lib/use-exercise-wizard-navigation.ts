import { useCallback, useState } from 'react'
import {
  EXERCISE_WIZARD_STEPS,
  type ExerciseWizardStep,
  exerciseWizardStepIndex,
} from './exercise-wizard-steps'

export function useExerciseWizardNavigation(
  initialStep: ExerciseWizardStep = 'identity',
) {
  const [currentStep, setCurrentStep] =
    useState<ExerciseWizardStep>(initialStep)
  const [visitedSteps, setVisitedSteps] = useState<Set<ExerciseWizardStep>>(
    () => new Set([initialStep]),
  )

  const markVisited = useCallback((step: ExerciseWizardStep) => {
    setVisitedSteps((current) => {
      if (current.has(step)) {
        return current
      }

      const next = new Set(current)
      next.add(step)
      return next
    })
  }, [])

  const goToStep = useCallback(
    (step: ExerciseWizardStep) => {
      setCurrentStep(step)
      markVisited(step)
    },
    [markVisited],
  )

  const goNext = useCallback(() => {
    const index = exerciseWizardStepIndex(currentStep)
    const next = EXERCISE_WIZARD_STEPS[index + 1]
    if (!next) {
      return
    }

    goToStep(next)
  }, [currentStep, goToStep])

  const goBack = useCallback(() => {
    const index = exerciseWizardStepIndex(currentStep)
    const previous = EXERCISE_WIZARD_STEPS[index - 1]
    if (!previous) {
      return
    }

    goToStep(previous)
  }, [currentStep, goToStep])

  const resetToIdentity = useCallback(() => {
    setCurrentStep('identity')
    setVisitedSteps(new Set(['identity']))
  }, [])

  const canJumpToStep = useCallback(
    (step: ExerciseWizardStep) => visitedSteps.has(step),
    [visitedSteps],
  )

  return {
    currentStep,
    goToStep,
    goNext,
    goBack,
    resetToIdentity,
    canJumpToStep,
  }
}
