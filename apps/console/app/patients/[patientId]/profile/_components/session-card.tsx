'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Chart from '@/components/ui/progress-chart'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'

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
  type StabilityMode,
  type FatigueMode,
} from '@/lib/session-metrics'
import { ExtendedPatientSession, ProgressDataPoint } from '@/types/models'
import {
  getQueryClient,
  useExercise,
  useORPC,
  usePatientPrograms,
  useUpdatePatientSession,
  useUserName,
} from '@virtality/react-query'
import { format } from 'date-fns'
import {
  ChartArea,
  ChevronLeft,
  ChevronRight,
  List,
  MoveLeft,
  BarChart3,
  Zap,
  Target,
  Info,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { Exercise } from '@virtality/db'
import usePageViewTracking from '@/hooks/analytics/use-page-view-tracking'

interface SessionCardProps {
  session: ExtendedPatientSession
  patientId: string
  onBack: (value: string) => void
}

const SessionCard = ({ session, patientId, onBack }: SessionCardProps) => {
  usePageViewTracking({
    props: { route_group: 'patient', tab_view: 'patient-session' },
  })
  const queryClient = getQueryClient()
  const orpc = useORPC()
  const [chartIndex, setChartIndex] = useState(0)
  const [notes, setNotes] = useState(session?.notes ?? '')
  const [isEditing, setIsEditing] = useState(false)
  const [view, setView] = useState(true)

  const { data: programs } = usePatientPrograms({ patientId })
  const { data: userName } = useUserName()
  const { data: exercises } = useExercise()

  const { mutate: updatePatientSession, isPending } = useUpdatePatientSession({
    onSuccess: () => {
      toast.success('Notes updated successfully.')
      return Promise.all([
        queryClient.invalidateQueries({
          queryKey: orpc.patientSession.list.key({
            input: { where: { patientId } },
          }),
        }),
        queryClient.invalidateQueries({
          queryKey: orpc.patientSession.find.key({
            input: { where: { id: session.id } },
          }),
        }),
      ])
    },
  })

  const chartData =
    session?.sessionData.map((data) => {
      const value = JSON.parse(data.value) as ProgressDataPoint[]
      const id = session.sessionExercise.find(
        (ex) => ex.id === data.sessionExerciseId,
      )?.exerciseId
      const name = exercises?.find((ex) => ex.id === id)?.displayName
      return { value, name }
    }) ?? []

  const sessionDuration = () => {
    if (!session) return 0
    const { completedAt, createdAt } = session
    if (completedAt && createdAt) {
      const start = new Date(createdAt).getTime()
      const end = new Date(completedAt).getTime()
      return ((end - start) / 60_000).toFixed(2)
    }
    return 0
  }

  const completedAtTime = () => {
    if (!session) return '00:00'
    return format(session.completedAt!, 'H:mm')
  }

  const sessionProgress = () => {
    const count = session?.sessionData?.reduce((acc, next) => {
      const arr = JSON.parse(next.value) as ProgressDataPoint[]
      if (arr.length === 0) return acc
      return acc + 1
    }, 0)

    if (count === 0 || !count || !session) return 0

    const sessionAvg =
      session?.sessionData?.reduce((acc, next) => {
        const values = JSON.parse(next.value) as ProgressDataPoint[]

        if (values.length === 0) return acc
        const keys = Object.keys(values[0]).slice(1)
        const avg =
          values.reduce((acc, point) => {
            const pointSum = Object.values(point).reduce((sum, val, idx) => {
              if (idx === 0) return sum
              return sum + val
            }, 0)
            const avgValue = pointSum / keys.length
            return acc + avgValue
          }, 0) / values.length

        return acc + avg
      }, 0) / count

    return sessionAvg
  }

  const currentProgram = programs?.find((p) => session?.programId === p.id)

  const increment = () => {
    setChartIndex((prev) => prev + 1)
  }

  const decrement = () => {
    setChartIndex((prev) => prev - 1)
  }

  const handleSaveNotes = () => {
    updatePatientSession({ id: session.id, notes })
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  const handleBack = () => {
    onBack('')
  }

  return (
    <AnimatePresence mode='wait'>
      {
        <motion.div
          key={session.id}
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className='bg-vital-blue-700/40 flex flex-1 flex-col rounded-xl'
        >
          <Card className='flex-1 p-6'>
            <CardHeader>
              <CardTitle className='flex justify-between'>
                <span>{currentProgram?.name}</span>
                <div className='flex flex-col gap-2'>
                  {session.completedAt && (
                    <Badge variant='outline'>Completed</Badge>
                  )}
                  <Button
                    size='icon'
                    className='ml-auto'
                    onClick={() => {
                      setView(!view)
                    }}
                  >
                    {view ? <ChartArea /> : <List />}
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                {format(session.completedAt!, 'PPPP')} at {completedAtTime()}
              </CardDescription>
            </CardHeader>
            <div className='flex flex-1 flex-col space-y-6'>
              <Separator />
              {view ? (
                <div className='space-y-6'>
                  {/* Session Info */}
                  <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                    <div className='space-y-4'>
                      <div>
                        <h3 className='mb-2 font-medium'>Session Details</h3>
                        <div className='space-y-2 text-sm'>
                          <div className='flex justify-between'>
                            <span className='text-muted-foreground'>
                              Duration:
                            </span>
                            <span>{sessionDuration()} minutes</span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-muted-foreground'>
                              Therapist:
                            </span>
                            <span>{userName ?? 'Unknown'}</span>
                          </div>

                          <div className='flex justify-between'>
                            <span className='text-muted-foreground'>
                              Progress:
                            </span>
                            <span>{sessionProgress().toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>

                      {session.sessionExercise?.length > 0 && (
                        <div>
                          <h3 className='mb-2 font-medium'>
                            Exercises Performed
                          </h3>
                          <div className='space-y-2'>
                            {session.sessionExercise?.map((exercise, index) => {
                              const ex = exercises?.find(
                                (ex) => ex.id === exercise.exerciseId,
                              )
                              return (
                                <div
                                  key={index}
                                  className='flex items-center gap-2'
                                >
                                  <div className='bg-primary h-2 w-2 rounded-full' />
                                  <span className='text-sm'>
                                    {getDisplayName(ex)}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Session metrics */}
                  <MetricSection session={session} exercises={exercises} />

                  <Separator />

                  {/* Notes Section */}
                  <div>
                    <div className='mb-4 flex items-center justify-between'>
                      <h3 className='font-medium'>Session Notes</h3>
                      {!isEditing ? (
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => setIsEditing(true)}
                        >
                          Edit Notes
                        </Button>
                      ) : (
                        <div className='flex gap-2'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </Button>
                          <Button
                            size='sm'
                            onClick={handleSaveNotes}
                            disabled={isPending}
                          >
                            Save
                          </Button>
                        </div>
                      )}
                    </div>

                    {isEditing ? (
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder='Add session notes...'
                        className='min-h-[120px] resize-none'
                      />
                    ) : (
                      <div className='bg-muted/30 min-h-[120px] rounded-lg p-4'>
                        {notes ? (
                          <p className='text-sm leading-relaxed whitespace-pre-wrap'>
                            {notes}
                          </p>
                        ) : (
                          <p className='text-muted-foreground text-sm italic'>
                            No notes available for this session.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className='flex flex-1 flex-col'>
                  <div className='flex items-center justify-between gap-6 p-4'>
                    <div>{chartData[chartIndex].name}</div>
                    <div className='flex'>
                      <Button
                        size='icon'
                        variant='outline'
                        disabled={chartIndex === 0}
                        onClick={decrement}
                        className='rounded-r-none'
                      >
                        <ChevronLeft />
                      </Button>
                      <Button
                        size='icon'
                        variant='outline'
                        disabled={chartIndex === chartData.length - 1}
                        onClick={increment}
                        className='rounded-l-none'
                      >
                        <ChevronRight />
                      </Button>
                    </div>
                  </div>
                  <Chart
                    data={chartData[chartIndex].value}
                    className='aspect-none flex-1 xl:max-h-[46svh]'
                  />
                </div>
              )}
            </div>
            <Button onClick={handleBack} className='w-fit'>
              <MoveLeft /> Back
            </Button>
          </Card>
        </motion.div>
      }
    </AnimatePresence>
  )
}

export default SessionCard

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
                  className={`rounded px-2 py-0.5 font-medium ${stabilityMode === 'cv' ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                >
                  CV
                </button>
                <button
                  type='button'
                  onClick={() => setStabilityMode('sd')}
                  className={`rounded px-2 py-0.5 font-medium ${stabilityMode === 'sd' ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                >
                  SD
                </button>
              </div>
              <div className='flex items-center gap-1.5'>
                <span className='text-muted-foreground'>Fatigue:</span>
                <button
                  type='button'
                  onClick={() => setFatigueMode('across-exercise')}
                  className={`rounded px-2 py-0.5 font-medium ${fatigueMode === 'across-exercise' ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                >
                  Across
                </button>
                <button
                  type='button'
                  onClick={() => setFatigueMode('within-set')}
                  className={`rounded px-2 py-0.5 font-medium ${fatigueMode === 'within-set' ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
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

const MetricInfo = ({
  title,
  description,
  options,
}: {
  title: string
  description: string
  options?: string
}) => {
  const [open, setOpen] = useState(false)
  const handleToggleTooltip = () => setOpen(!open)
  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger
        aria-label={`Info: ${title}`}
        onClick={handleToggleTooltip}
      >
        <Info className='size-3.5' />
      </TooltipTrigger>
      <TooltipContent side='top' className='max-w-[280px] px-3 py-2 text-left'>
        <p className='font-medium'>{title}</p>
        <p className='mt-1 text-zinc-300 dark:text-zinc-600'>{description}</p>
        {options && (
          <p className='mt-1.5 border-t border-zinc-700 pt-1.5 text-zinc-400 dark:border-zinc-600 dark:text-zinc-500'>
            {options}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  )
}
