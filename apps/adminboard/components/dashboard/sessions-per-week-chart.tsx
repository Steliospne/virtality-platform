'use client'

import { usePatientSessionsPerDatePerUser } from '@virtality/react-query'
import { addDays, format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { type DateRange } from 'react-day-picker'
import { useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@virtality/ui/components/card'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

type Granularity = 'day' | 'week'

const chartColors = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

const MIN_WINDOW_DAYS = 3

type SessionPoint = {
  bucketStart?: string
  week?: number
  year?: number
  count: number
}

type UserSessions = {
  userId: string
  userName: string
  sessions: SessionPoint[]
}

type ChartRow = Record<string, string | number>

type ChartModel = {
  chartData: ChartRow[]
  visibleUsers: UserSessions[]
}

const getDefaultRange = (): { from: Date; to: Date } => {
  const to = new Date()
  to.setHours(0, 0, 0, 0)
  const from = addDays(to, -6)
  return { from, to }
}

const toIsoDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseIsoDate = (value: string): Date => new Date(`${value}T00:00:00`)

const getWeekStart = (date: Date): Date => {
  const start = new Date(date)
  const day = start.getDay() || 7
  start.setDate(start.getDate() - day + 1)
  start.setHours(0, 0, 0, 0)
  return start
}

const getFullWeekRange = (
  from: Date,
  to: Date,
): { from: Date; to: Date } | null => {
  const fullFrom = getWeekStart(from)
  if (fullFrom < from) {
    fullFrom.setDate(fullFrom.getDate() + 7)
  }

  const fullTo = addDays(getWeekStart(to), 6)
  if (fullTo > to) {
    fullTo.setDate(fullTo.getDate() - 7)
  }

  if (fullFrom > fullTo) {
    return null
  }

  return { from: fullFrom, to: fullTo }
}

const buildBucketKeys = (
  from: Date,
  to: Date,
  granularity: Granularity,
): string[] => {
  const keys: string[] = []
  const cursor = new Date(from)
  cursor.setHours(0, 0, 0, 0)
  const toDay = new Date(to)
  toDay.setHours(0, 0, 0, 0)

  if (granularity === 'day') {
    while (cursor <= toDay) {
      keys.push(toIsoDate(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    return keys
  }

  const weekCursor = getWeekStart(cursor)
  while (weekCursor <= toDay) {
    keys.push(toIsoDate(weekCursor))
    weekCursor.setDate(weekCursor.getDate() + 7)
  }

  return keys
}

const formatBucketLabel = (
  bucketStart: string,
  granularity: Granularity,
): string => {
  const start = parseIsoDate(bucketStart)
  if (granularity === 'day') {
    return format(start, 'dd/MM')
  }

  const end = addDays(start, 6)
  return `${format(start, 'dd/MM')}-${format(end, 'dd/MM')}`
}

const formatDateRangeLabel = (from: Date, to: Date): string =>
  `${format(from, 'dd/MM')} - ${format(to, 'dd/MM')}`

const getLegacyWeekBucketStart = (year: number, week: number): string => {
  const januaryFourth = new Date(Date.UTC(year, 0, 4))
  const januaryFourthDay = januaryFourth.getUTCDay() || 7
  const isoWeekOneStart = new Date(januaryFourth)
  isoWeekOneStart.setUTCDate(januaryFourth.getUTCDate() - januaryFourthDay + 1)
  const bucketStart = new Date(isoWeekOneStart)
  bucketStart.setUTCDate(isoWeekOneStart.getUTCDate() + (week - 1) * 7)
  return bucketStart.toISOString().slice(0, 10)
}

const getPointBucketStart = (point: SessionPoint): string | null => {
  if (point.bucketStart) {
    return point.bucketStart
  }
  if (typeof point.year === 'number' && typeof point.week === 'number') {
    return getLegacyWeekBucketStart(point.year, point.week)
  }
  return null
}

const buildUserCountsByBucket = (
  users: UserSessions[],
): Map<string, Map<string, number>> => {
  const countsByUser = new Map<string, Map<string, number>>()

  users.forEach((user) => {
    const normalizedPoints = user.sessions
      .map((point) => {
        const bucketStart = getPointBucketStart(point)
        return bucketStart ? [bucketStart, point.count] : null
      })
      .filter((entry): entry is [string, number] => entry !== null)

    countsByUser.set(user.userId, new Map(normalizedPoints))
  })

  return countsByUser
}

const hasSessionsInWindow = (
  userId: string,
  bucketKeys: string[],
  countsByUser: Map<string, Map<string, number>>,
): boolean => {
  const userCounts = countsByUser.get(userId)
  if (!userCounts) return false
  const total = bucketKeys.reduce(
    (sum, bucketKey) => sum + (userCounts.get(bucketKey) ?? 0),
    0,
  )
  return total > 0
}

const buildChartModel = (
  users: UserSessions[],
  bucketKeys: string[],
  granularity: Granularity,
): ChartModel => {
  const countsByUser = buildUserCountsByBucket(users)

  const visibleUsers = users.filter((user) =>
    hasSessionsInWindow(user.userId, bucketKeys, countsByUser),
  )

  const chartData = bucketKeys.map((bucketKey) => {
    const row: ChartRow = {
      bucketStart: bucketKey,
      label: formatBucketLabel(bucketKey, granularity),
    }

    visibleUsers.forEach((user) => {
      const userCounts = countsByUser.get(user.userId)
      const count = userCounts?.get(bucketKey) ?? 0

      if (count > 0) {
        row[user.userId] = count
      }
    })

    return row
  })

  return { chartData, visibleUsers }
}

export function SessionsPerWeekChart() {
  const { from: defaultFrom, to: defaultTo } = getDefaultRange()

  const [granularity, setGranularity] = useState<Granularity>('week')
  const [appliedRange, setAppliedRange] = useState<DateRange>({
    from: defaultFrom,
    to: defaultTo,
  })
  const [pickerRange, setPickerRange] = useState<DateRange | undefined>({
    from: defaultFrom,
    to: defaultTo,
  })

  const [popoverOpen, setPopoverOpen] = useState(false)
  const rangeFrom = appliedRange.from ?? defaultFrom
  const rangeTo = appliedRange.to ?? defaultTo

  const fullWeekRange = useMemo(
    () => getFullWeekRange(rangeFrom, rangeTo),
    [rangeFrom, rangeTo],
  )
  const queryFrom = granularity === 'week' ? fullWeekRange?.from : rangeFrom
  const queryTo = granularity === 'week' ? fullWeekRange?.to : rangeTo

  const {
    data: users,
    isLoading,
    isError,
  } = usePatientSessionsPerDatePerUser(
    !queryFrom || !queryTo
      ? undefined
      : {
          from: queryFrom,
          to: queryTo,
          granularity,
        },
  )

  const { chartData, visibleUsers } = useMemo(() => {
    if (!users || !queryFrom || !queryTo) {
      return { chartData: [], visibleUsers: [] as UserSessions[] }
    }

    const bucketKeys = buildBucketKeys(queryFrom, queryTo, granularity)
    return buildChartModel(users, bucketKeys, granularity)
  }, [granularity, queryFrom, queryTo, users])

  const onRangeSelect = (nextRange: DateRange | undefined) => {
    setPickerRange(nextRange)
  }

  const applyPickerRange = () => {
    if (!pickerRange?.from || !pickerRange.to) {
      return
    }

    const from = new Date(pickerRange.from)
    const to = new Date(pickerRange.to)
    from.setHours(0, 0, 0, 0)
    to.setHours(0, 0, 0, 0)

    setAppliedRange({ from, to })
    setPickerRange({ from, to })
    setPopoverOpen(false)
  }

  return (
    <Card className='shadow-sm transition-shadow hover:shadow-md'>
      <CardHeader className='pb-4'>
        <div className='flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
          <div>
            <CardTitle className='text-base font-semibold'>
              Sessions by Doctor
            </CardTitle>
            <CardDescription>
              Daily or weekly session volume in the selected date window
            </CardDescription>
          </div>
          <div className='flex flex-col gap-2 md:items-end'>
            <div className='flex flex-wrap items-center gap-2'>
              <Tabs
                value={granularity}
                onValueChange={(value) => setGranularity(value as Granularity)}
              >
                <TabsList>
                  <TabsTrigger value='day'>Daily</TabsTrigger>
                  <TabsTrigger value='week'>Weekly</TabsTrigger>
                </TabsList>
              </Tabs>
              <Popover
                open={popoverOpen}
                onOpenChange={(open) => {
                  setPopoverOpen(open)
                  if (open) {
                    setPickerRange(appliedRange)
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className='min-w-[180px] justify-start'
                  >
                    <CalendarIcon className='size-4' />
                    {formatDateRangeLabel(rangeFrom, rangeTo)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-[450px] p-0' align='end'>
                  <Calendar
                    mode='range'
                    defaultMonth={rangeFrom ?? undefined}
                    selected={pickerRange}
                    onSelect={onRangeSelect}
                    min={MIN_WINDOW_DAYS - 1}
                    showOutsideDays={false}
                    numberOfMonths={2}
                    className='w-full'
                    classNames={{
                      range_start:
                        'bg-neutral-800 rounded-l-md text-white dark:bg-neutral-100 dark:text-black',
                      range_middle:
                        'bg-neutral-200 rounded-none dark:text-black',
                      range_end:
                        'bg-neutral-800 rounded-r-md text-white dark:bg-neutral-100 dark:text-black',
                    }}
                    disabled={(date) =>
                      date > new Date() || date < new Date('1900-01-01')
                    }
                  />
                  <div className='flex justify-end border-t p-3'>
                    <Button
                      size='sm'
                      onClick={applyPickerRange}
                      disabled={!pickerRange?.from || !pickerRange.to}
                    >
                      Apply
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <p className='text-muted-foreground text-xs'>
              Window must be a minimum of {MIN_WINDOW_DAYS} days.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isError ? (
          <div className='text-sm text-red-600 dark:text-red-400'>
            Failed to load chart data.
          </div>
        ) : visibleUsers.length === 0 ? (
          <div className='text-muted-foreground flex h-[400px] items-center justify-center text-sm'>
            No user activity for the selected date range.
          </div>
        ) : (
          <ResponsiveContainer width='100%' height={400}>
            <BarChart data={chartData}>
              <CartesianGrid
                stroke='var(--border)'
                strokeDasharray='3 3'
                opacity={0.55}
              />
              <XAxis
                dataKey='label'
                angle={-45}
                textAnchor='end'
                height={100}
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={{ stroke: 'var(--border)' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={{ stroke: 'var(--border)' }}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{
                  fill: 'color-mix(in oklab, var(--accent) 35%, transparent)',
                }}
                labelFormatter={(_, payload) => {
                  const rawLabel = payload?.[0]?.payload?.bucketStart
                  if (typeof rawLabel !== 'string') return ''
                  if (granularity === 'day') {
                    return format(parseIsoDate(rawLabel), 'EEE, dd MMM yyyy')
                  }
                  const weekStart = parseIsoDate(rawLabel)
                  const weekEnd = addDays(weekStart, 6)
                  return `${format(weekStart, 'dd MMM yyyy')} - ${format(weekEnd, 'dd MMM yyyy')}`
                }}
                contentStyle={{
                  backgroundColor: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  boxShadow:
                    '0 10px 30px color-mix(in oklab, var(--foreground) 10%, transparent)',
                }}
                labelStyle={{ color: 'var(--muted-foreground)' }}
              />
              <Legend wrapperStyle={{ color: 'var(--muted-foreground)' }} />
              {visibleUsers.map((user, index) => (
                <Bar
                  key={user.userId}
                  dataKey={user.userId}
                  name={user.userName}
                  fill={chartColors[index % chartColors.length]}
                  radius={[8, 8, 0, 0]}
                  animationDuration={isLoading ? 0 : 300}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
