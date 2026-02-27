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
import useUpdatePatientSession from '@/hooks/mutations/patient-session/use-update-patient-session'
import usePatientPrograms from '@/hooks/queries/patient-program/use-patient-programs'
import useExercise from '@/hooks/queries/use-exercise'
import useUserName from '@/hooks/queries/user/use-user-name'
import { orpc } from '@/integrations/orpc/client'
import { getQueryClient } from '@/integrations/tanstack-query/provider'
import { getDisplayName } from '@/lib/utils'
import { ExtendedPatientSession, ProgressDataPoint } from '@/types/models'
import { format } from 'date-fns'
import {
  ChartArea,
  ChevronLeft,
  ChevronRight,
  List,
  MoveLeft,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { toast } from 'react-toastify'

interface SessionCardProps {
  session: ExtendedPatientSession
  patientId: string
  onBack: (value: string) => void
}

const SessionCard = ({ session, patientId, onBack }: SessionCardProps) => {
  const { queryClient } = getQueryClient()

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
                    <Badge
                      variant='outline'
                      // className={`${getStatusColor(session.completedAt)}`}
                    >
                      Completed
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
                          <Button size='sm' onClick={handleSaveNotes}>
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
