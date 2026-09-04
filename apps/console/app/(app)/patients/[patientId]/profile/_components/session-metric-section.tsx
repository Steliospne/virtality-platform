'use client'

import { Separator } from '@virtality/ui/components/separator'
import { cn, getDisplayName } from '@/lib/utils'
import {
  getSessionDurationMinutes,
  getExerciseQualityScore,
  getPeakCapability,
  getStabilityScore,
  getFatigueIndex,
  getSetToSetAdaptation,
  getDosePerSession,
  getDosePerExercise,
  type StabilityMode,
  type FatigueMode,
} from '@/lib/session-metrics'
import { ExtendedPatientSession } from '@/types/models'
import { Exercise } from '@virtality/db'
import { BarChart3, Zap, Target } from 'lucide-react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useState } from 'react'
import MetricInfo from './session-metric-info'

const MetricSection = ({
  session,
  exercises,
}: {
  session: ExtendedPatientSession
  exercises?: Exercise[]
}) => {
  const [stabilityMode, setStabilityMode] = useState<StabilityMode>('cv')
  const [fatigueMode, setFatigueMode] = useState<FatigueMode>('across-exercise')

  const durationMin = getSessionDurationMinutes(session)
  const quality = getExerciseQualityScore(session)
  const qualityAvg = quality.length
    ? quality.reduce((a, b) => a + b.avgProgressPct, 0) / quality.length
    : 0
  const peak = getPeakCapability(session)
  const stability = getStabilityScore(session, stabilityMode)
  const fatigue = getFatigueIndex(session, fatigueMode)
  const setToSet = getSetToSetAdaptation(session)
  const doseTotal = getDosePerSession(session)
  const dosePerEx = getDosePerExercise(session)

  return (
    <>
      <Separator />
      <TooltipProvider delayDuration={200}>
        <div className='space-y-4'>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <h3 className='font-medium'>Session metrics</h3>
            <div className='flex flex-wrap gap-3 text-xs'>
              <div className='flex items-center gap-1.5'>
                <span className='text-muted-foreground'>Stability:</span>
                <button
                  type='button'
                  onClick={() => setStabilityMode('cv')}
                  className={cn(
                    'rounded px-2 py-0.5 font-medium',
                    stabilityMode === 'cv'
                      ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200'
                      : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800',
                  )}
                >
                  CV
                </button>
                <button
                  type='button'
                  onClick={() => setStabilityMode('sd')}
                  className={cn(
                    'rounded px-2 py-0.5 font-medium',
                    stabilityMode === 'sd'
                      ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200'
                      : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800',
                  )}
                >
                  SD
                </button>
              </div>
              <div className='flex items-center gap-1.5'>
                <span className='text-muted-foreground'>Fatigue:</span>
                <button
                  type='button'
                  onClick={() => setFatigueMode('across-exercise')}
                  className={cn(
                    'rounded px-2 py-0.5 font-medium',
                    fatigueMode === 'across-exercise'
                      ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200'
                      : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800',
                  )}
                >
                  Across
                </button>
                <button
                  type='button'
                  onClick={() => setFatigueMode('within-set')}
                  className={cn(
                    'rounded px-2 py-0.5 font-medium',
                    fatigueMode === 'within-set'
                      ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200'
                      : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800',
                  )}
                >
                  Within set
                </button>
              </div>
            </div>
          </div>
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
            {durationMin != null && (
              <div className='flex items-center gap-2 rounded-lg border border-zinc-200/80 bg-zinc-50/50 p-3 dark:border-zinc-700/80 dark:bg-zinc-800/40'>
                <BarChart3 className='size-4 shrink-0 text-teal-600 dark:text-teal-400' />
                <div className='min-w-0 flex-1'>
                  <div className='flex items-center gap-1.5'>
                    <p className='text-muted-foreground text-xs'>Duration</p>
                    <MetricInfo
                      title='Duration'
                      description='Time from session start to completion, shown in minutes.'
                    />
                  </div>
                  <p className='font-semibold tabular-nums'>
                    {durationMin.toFixed(1)} min
                  </p>
                </div>
              </div>
            )}
            <div className='flex items-center gap-2 rounded-lg border border-zinc-200/80 bg-zinc-50/50 p-3 dark:border-zinc-700/80 dark:bg-zinc-800/40'>
              <Target className='size-4 shrink-0 text-teal-600 dark:text-teal-400' />
              <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-1.5'>
                  <p className='text-muted-foreground text-xs'>Quality (avg)</p>
                  <MetricInfo
                    title='Quality (average)'
                    description='Average rep progress (%) across all exercises in this session. Reflects how well the patient performed relative to the target.'
                  />
                </div>
                <p className='font-semibold tabular-nums'>
                  {qualityAvg.toFixed(1)}%
                </p>
              </div>
            </div>
            <div className='flex items-center gap-2 rounded-lg border border-zinc-200/80 bg-zinc-50/50 p-3 dark:border-zinc-700/80 dark:bg-zinc-800/40'>
              <Zap className='size-4 shrink-0 text-teal-600 dark:text-teal-400' />
              <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-1.5'>
                  <p className='text-muted-foreground text-xs'>
                    Peak capability
                  </p>
                  <MetricInfo
                    title='Peak capability'
                    description='Best single rep score (%) in this session across all exercises. Your session “highscore”.'
                  />
                </div>
                <p className='font-semibold tabular-nums'>
                  {peak.sessionBest.toFixed(1)}%
                </p>
              </div>
            </div>
            <div className='flex items-center gap-2 rounded-lg border border-zinc-200/80 bg-zinc-50/50 p-3 dark:border-zinc-700/80 dark:bg-zinc-800/40'>
              <div className='flex size-4 shrink-0 items-center justify-center rounded bg-teal-100 text-xs font-bold text-teal-700 dark:bg-teal-900/50 dark:text-teal-300'>
                σ
              </div>
              <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-1.5'>
                  <p className='text-muted-foreground text-xs'>
                    Stability ({stabilityMode === 'cv' ? 'CV' : 'SD'})
                  </p>
                  <MetricInfo
                    title='Stability'
                    description='Consistency of rep scores. Lower values usually indicate more stable motor control.'
                    options='Options: CV (coefficient of variation = σ/mean) or SD (standard deviation). Use the Stability toggle above to switch.'
                  />
                </div>
                <p className='font-semibold tabular-nums'>
                  {stability.sessionValue.toFixed(2)}
                </p>
              </div>
            </div>
            <div className='flex items-center gap-2 rounded-lg border border-zinc-200/80 bg-zinc-50/50 p-3 dark:border-zinc-700/80 dark:bg-zinc-800/40'>
              <div className='size-4 shrink-0 rounded bg-amber-100 text-center text-xs font-bold text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'>
                F
              </div>
              <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-1.5'>
                  <p className='text-muted-foreground text-xs'>
                    Fatigue drop-off
                  </p>
                  <MetricInfo
                    title='Fatigue drop-off'
                    description='Compares rep quality in the first third vs the last third. Positive % means quality dropped toward the end (possible fatigue or pain).'
                    options='Options: “Across exercise” (all reps in order) or “Within set” (per set). Use the Fatigue toggle above to switch.'
                  />
                </div>
                <p className='font-semibold tabular-nums'>
                  {fatigue.sessionDropOffPct.toFixed(1)}%
                </p>
              </div>
            </div>
            <div className='flex items-center gap-2 rounded-lg border border-zinc-200/80 bg-zinc-50/50 p-3 dark:border-zinc-700/80 dark:bg-zinc-800/40'>
              <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-1.5'>
                  <p className='text-muted-foreground text-xs'>
                    Set 1 → last set
                  </p>
                  <MetricInfo
                    title='Set-to-set adaptation'
                    description='Percentage change in average progress from the first set to the last. Positive = improving (warm-up/motor learning); negative = declining (fatigue).'
                  />
                </div>
                <p className='font-semibold tabular-nums'>
                  {setToSet.sessionPctChange >= 0 ? '+' : ''}
                  {setToSet.sessionPctChange.toFixed(1)}%
                </p>
              </div>
            </div>
            <div className='flex items-center gap-2 rounded-lg border border-zinc-200/80 bg-zinc-50/50 p-3 sm:col-span-2 dark:border-zinc-700/80 dark:bg-zinc-800/40'>
              <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-1.5'>
                  <p className='text-muted-foreground text-xs'>
                    Dose (volume proxy)
                  </p>
                  <MetricInfo
                    title='Dose (volume proxy)'
                    description='Planned volume proxy = sets × reps × holdTime × speed for each exercise; total is the sum. Shown per session and per exercise below. Trends over time can indicate load progression.'
                  />
                </div>
                <p className='font-semibold tabular-nums'>
                  {doseTotal.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </p>
                {dosePerEx.length > 0 && (
                  <ul className='text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs'>
                    {dosePerEx.map((d, i) => {
                      const ex = exercises?.find((e) => e.id === d.exerciseId)
                      return (
                        <li key={i}>
                          {getDisplayName(ex)}:{' '}
                          {d.dose.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </TooltipProvider>
    </>
  )
}

export default MetricSection
