'use client'

import { Badge } from '@virtality/ui/components/badge'
import { Button } from '@virtality/ui/components/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@virtality/ui/components/card'
import { Separator } from '@virtality/ui/components/separator'

import { getDisplayName } from '@/lib/utils'
import { ExtendedPatientSession, ProgressDataPoint } from '@/types/models'
import { useExercise, useUserName } from '@virtality/react-query'
import { format } from 'date-fns'
import { ChartArea, List, MoveLeft } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import usePageViewTracking from '@/hooks/analytics/use-page-view-tracking'
import {
  getClinicalHistorySessionStatusLabel,
  getSessionSourceProgramDisplayName,
} from '@/lib/session-history'
import MetricSection from './session-metric-section'
import SessionCardNotes from './session-card-notes'
import SessionCardChart from './session-card-chart'

interface SessionCardProps {
  session: ExtendedPatientSession
  patientId: string
  onBack: (value: string) => void
}

const SessionCard = ({ session, patientId, onBack }: SessionCardProps) => {
  usePageViewTracking({
    props: { route_group: 'patient', tab_view: 'patient-session' },
  })
  const [view, setView] = useState(true)

  const { data: userName } = useUserName()
  const { data: exercises } = useExercise()

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

  const statusLabel = getClinicalHistorySessionStatusLabel(session.status)
  const historyDate =
    session.completedAt != null
      ? new Date(session.completedAt)
      : new Date(session.createdAt)

  const completedAtTime = () => format(historyDate, 'H:mm')

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

  const sourceProgramName = getSessionSourceProgramDisplayName(session)

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
                <span>{sourceProgramName}</span>
                <div className='flex flex-col gap-2'>
                  {statusLabel && (
                    <Badge
                      variant={
                        statusLabel === 'Interrupted' ? 'secondary' : 'outline'
                      }
                    >
                      {statusLabel}
                    </Badge>
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
                {format(historyDate, 'PPPP')} at {completedAtTime()}
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
                  <SessionCardNotes session={session} patientId={patientId} />
                </div>
              ) : (
                <SessionCardChart session={session} exercises={exercises} />
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
