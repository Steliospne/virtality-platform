'use client'

import { Separator } from '@virtality/ui/components/separator'
import { getDisplayName } from '@/lib/utils'
import {
  getSessionDurationMinutes,
  getExerciseQualityScore,
  getPeakCapability,
  getStabilityScore,
  getFatigueIndex,
  getSetToSetAdaptation,
  getDosePerSession,
  getDosePerExercise,
} from '@/lib/session-metrics'
import { ExtendedPatientSession } from '@/types/models'
import { Exercise } from '@virtality/db'
import { BarChart3, Zap, Target } from 'lucide-react'
import { TooltipProvider } from '@/components/ui/tooltip'
import MetricInfo from './session-metric-info'

const MetricSection = ({
  session,
  exercises,
}: {
  session: ExtendedPatientSession
  exercises?: Exercise[]
}) => {
  const durationMin = getSessionDurationMinutes(session)
  const quality = getExerciseQualityScore(session)
  const qualityAvg = quality.length
    ? quality.reduce((a, b) => a + b.avgProgressPct, 0) / quality.length
    : 0
  const peak = getPeakCapability(session)
  const stability = getStabilityScore(session, 'sd')
  const fatigue = getFatigueIndex(session, 'within-set')
  const setToSet = getSetToSetAdaptation(session)
  const doseTotal = getDosePerSession(session)
  const dosePerEx = getDosePerExercise(session)

  return (
    <>
      <Separator />
      <TooltipProvider delayDuration={200}>
        <div className='space-y-4'>
          <h3 className='font-medium'>Session metrics</h3>
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
                  <p className='text-muted-foreground text-xs'>
                    Average progress
                  </p>
                  <MetricInfo
                    title='Average progress'
                    description='Average progress (%) across all exercises in this session.'
                    footnote='Range: 0% – 100%'
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
                    Best repetition
                  </p>
                  <MetricInfo
                    title='Best repetition'
                    description='Your highest movement score from a single repetition in this session.'
                    footnote='Range: 0% – 100%'
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
                    Movement consistency
                  </p>
                  <MetricInfo
                    title='Movement consistency'
                    description='How much your repetition scores varied. Lower values mean more consistent scores, even if those scores were low.'
                    footnote='Range: 0 – 50 points'
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
                    description='Compares earlier and later repetition scores. Positive values mean scores dropped; negative values mean scores improved.'
                    footnote='Range: -∞% – +100%'
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
                    First set → Last set
                  </p>
                  <MetricInfo
                    title='First set → Last set'
                    description='Compares your average score in the first and last sets. Positive values mean improvement; negative values mean a decline.'
                    footnote='Range: -100% – +∞%'
                  />
                </div>
                <p className='font-semibold tabular-nums'>
                  {setToSet.sessionPctChange >= 0 ? '+' : ''}
                  {setToSet.sessionPctChange.toFixed(1)}%
                </p>
              </div>
            </div>
            <div className='flex items-center gap-2 rounded-lg border border-zinc-200/80 bg-zinc-50/50 p-3 sm:col-span-2 lg:col-span-3 dark:border-zinc-700/80 dark:bg-zinc-800/40'>
              <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-1.5'>
                  <p className='text-muted-foreground text-xs'>
                    Total Repetitions (Volume)
                  </p>
                  <MetricInfo
                    title='Total Repetitions (Volume)'
                    description='An estimate based on sets, repetitions, hold time and speed. Higher values represent more planned load.'
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
