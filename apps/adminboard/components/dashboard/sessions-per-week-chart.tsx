'use client'

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
} from '@/components/ui/card'

interface SessionData {
  week: number
  year: number
  count: number
}

interface UserSessions {
  userId: string
  userName: string
  sessions: SessionData[]
}

interface SessionsPerWeekChartProps {
  data: UserSessions[]
}

export function SessionsPerWeekChart({ data }: SessionsPerWeekChartProps) {
  // Get all unique week/year combinations
  const allWeeks = new Set<string>()
  data.forEach((user) => {
    user.sessions.forEach((session) => {
      allWeeks.add(
        `${session.year}-W${session.week.toString().padStart(2, '0')}`,
      )
    })
  })

  // Create chart data with all weeks and user data
  const weeksArray = Array.from(allWeeks).sort()
  const chartData = weeksArray.map((weekKey) => {
    const entry: Record<string, string | number> = { week: weekKey }
    data.forEach((user) => {
      const session = user.sessions.find(
        (s) => `${s.year}-W${s.week.toString().padStart(2, '0')}` === weekKey,
      )
      entry[user.userName] = session?.count || 0
    })
    return entry
  })

  const chartColors = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
  ]

  return (
    <Card className='shadow-sm transition-shadow hover:shadow-md'>
      <CardHeader className='pb-4'>
        <CardTitle className='text-base font-semibold'>
          Sessions per Week by Doctor
        </CardTitle>
        <CardDescription>
          Weekly session volume, grouped by doctor
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width='100%' height={400}>
          <BarChart data={chartData}>
            <CartesianGrid
              stroke='var(--border)'
              strokeDasharray='3 3'
              opacity={0.55}
            />
            <XAxis
              dataKey='week'
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
            />
            <Tooltip
              cursor={{
                fill: 'color-mix(in oklab, var(--accent) 35%, transparent)',
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
            {data.map((user, index) => (
              <Bar
                key={user.userId}
                dataKey={user.userName}
                fill={chartColors[index % chartColors.length]}
                radius={[8, 8, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
