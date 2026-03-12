'use client'

import {
  getVisitConsistency,
  getSessionDurationTrend,
  getDoseTrend,
  filterSessionsByDateRange,
  DATE_RANGE_DAYS,
  type DateRangePreset,
} from '@/lib/session-metrics'
import type { ExtendedPatientSession } from '@/types/models'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { format } from 'date-fns'
import { Activity, Calendar as CalendarIcon, TrendingUp } from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

interface SessionsOverviewProps {
  sessions: ExtendedPatientSession[]
  startDate: Date
  rangePreset: DateRangePreset
  onStartDateChange: (date: Date) => void
  onRangePresetChange: (preset: DateRangePreset) => void
}

export function SessionsOverview({
  sessions,
  startDate,
  rangePreset,
  onStartDateChange,
  onRangePresetChange,
}: SessionsOverviewProps) {
  const filtered = filterSessionsByDateRange(sessions, startDate, rangePreset)
  const gapThresholdDays = DATE_RANGE_DAYS[rangePreset]
  const { avgDaysBetween, gaps } = getVisitConsistency(
    filtered,
    gapThresholdDays,
  )
  const durationTrend = getSessionDurationTrend(filtered)
  const doseTrend = getDoseTrend(filtered)
  const avgDuration =
    durationTrend.length > 0
      ? durationTrend.reduce((a, b) => a + b.durationMin, 0) /
        durationTrend.length
      : null
  const totalDose = doseTrend.reduce((a, b) => a + b.dose, 0)
  const avgDosePerSession =
    doseTrend.length > 0 ? totalDose / doseTrend.length : 0

  return (
    <motion.div
      className='space-y-6'
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className='flex flex-wrap items-end gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950'>
        <div className='flex flex-col gap-2'>
          <Label className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>
            From date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                className={cn(
                  'h-9 w-[200px] justify-start pl-3 text-left font-normal',
                  'border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900/50 dark:hover:bg-zinc-800/50',
                )}
              >
                {format(startDate, 'PPP')}
                <CalendarIcon className='ml-auto size-4 opacity-50' />
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='start'>
              <Calendar
                mode='single'
                selected={startDate}
                onSelect={(value) => value && onStartDateChange(value)}
                disabled={(date) => date > new Date()}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className='flex flex-col gap-2'>
          <Label className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>
            Range
          </Label>
          <Select
            value={rangePreset}
            onValueChange={(v) => onRangePresetChange(v as DateRangePreset)}
          >
            <SelectTrigger className='h-9 w-[140px] border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900/50'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='week'>Week</SelectItem>
              <SelectItem value='month'>Month</SelectItem>
              <SelectItem value='3months'>3 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className='ml-auto text-sm text-zinc-500 dark:text-zinc-400'>
          {filtered.length} session{filtered.length !== 1 ? 's' : ''} in range
        </p>
      </div>

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        <motion.div
          className='flex h-full'
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.05,
            duration: 0.3,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          <Card className='flex h-full w-full flex-col overflow-hidden border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950'>
            <CardHeader className='pb-2'>
              <CardTitle className='flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-300'>
                <CalendarIcon className='size-4 text-teal-600 dark:text-teal-400' />
                Visit consistency
              </CardTitle>
            </CardHeader>
            <CardContent className='flex flex-1 flex-col space-y-3'>
              {avgDaysBetween != null ? (
                <p className='text-2xl font-semibold text-zinc-900 tabular-nums dark:text-zinc-100'>
                  {avgDaysBetween.toFixed(1)}{' '}
                  <span className='text-sm font-normal text-zinc-500 dark:text-zinc-400'>
                    days avg
                  </span>
                </p>
              ) : (
                <p className='text-sm text-zinc-500 dark:text-zinc-400'>
                  Need 2+ sessions
                </p>
              )}
              {gaps.length > 0 && (
                <div className='mt-auto rounded-lg border border-amber-200/80 bg-amber-50/80 p-2 dark:border-amber-800/60 dark:bg-amber-950/30'>
                  <p className='text-xs font-medium text-amber-800 dark:text-amber-200'>
                    {gaps.length} gap{gaps.length !== 1 ? 's' : ''} &gt;
                    {gapThresholdDays}d
                  </p>
                  <ul className='mt-1 text-xs text-amber-700 dark:text-amber-300'>
                    {gaps.slice(0, 3).map((g, i) => (
                      <li key={i}>
                        {format(g.prevCompletedAt, 'd MMM')} →{' '}
                        {format(g.nextCompletedAt, 'd MMM')}:{' '}
                        {g.daysBetween.toFixed(0)}d
                      </li>
                    ))}
                    {gaps.length > 3 && <li>+{gaps.length - 3} more</li>}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          className='flex h-full'
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.1,
            duration: 0.3,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          <Card className='flex h-full w-full flex-col overflow-hidden border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950'>
            <CardHeader className='pb-2'>
              <CardTitle className='flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-300'>
                <Activity className='size-4 text-teal-600 dark:text-teal-400' />
                Session duration
              </CardTitle>
            </CardHeader>
            <CardContent className='flex flex-1 flex-col'>
              {avgDuration != null ? (
                <p className='text-2xl font-semibold text-zinc-900 tabular-nums dark:text-zinc-100'>
                  {avgDuration.toFixed(1)}{' '}
                  <span className='text-sm font-normal text-zinc-500 dark:text-zinc-400'>
                    min avg
                  </span>
                </p>
              ) : (
                <p className='text-sm text-zinc-500 dark:text-zinc-400'>
                  No completed sessions
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          className='flex h-full'
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.15,
            duration: 0.3,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          <Card className='flex h-full w-full flex-col overflow-hidden border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950'>
            <CardHeader className='pb-2'>
              <CardTitle className='flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-300'>
                <TrendingUp className='size-4 text-teal-600 dark:text-teal-400' />
                Dose (volume proxy)
              </CardTitle>
            </CardHeader>
            <CardContent className='flex flex-1 flex-col space-y-1'>
              <p className='text-2xl font-semibold text-zinc-900 tabular-nums dark:text-zinc-100'>
                {totalDose.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </p>
              <p className='text-xs text-zinc-500 dark:text-zinc-400'>
                {avgDosePerSession > 0
                  ? `~${avgDosePerSession.toLocaleString(undefined, { maximumFractionDigits: 0 })} per session`
                  : 'sets × reps × hold × speed'}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
