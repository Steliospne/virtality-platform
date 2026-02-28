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

interface SessionsPerPatientChartProps {
  data: Array<{ patientId: string | null; _count: { _all: number } }>
}

export function SessionsPerPatientChart({
  data,
}: SessionsPerPatientChartProps) {
  // Sort by session count descending and prepare chart data
  const chartData = data
    .map((item) => ({
      patientId: item.patientId?.substring(0, 8) + '...', // Truncate for display
      fullPatientId: item.patientId,
      sessions: item._count._all,
    }))
    .sort((a, b) => b.sessions - a.sessions)

  return (
    <Card className='shadow-sm transition-shadow hover:shadow-md'>
      <CardHeader className='pb-4'>
        <CardTitle className='text-base font-semibold'>
          Sessions per Patient
        </CardTitle>
        <CardDescription>
          How many sessions each patient has completed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer
          width='100%'
          height={Math.max(400, chartData.length * 30)}
        >
          <BarChart
            data={chartData}
            layout='vertical'
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid
              stroke='var(--border)'
              strokeDasharray='3 3'
              opacity={0.55}
            />
            <XAxis
              type='number'
              tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={{ stroke: 'var(--border)' }}
            />
            <YAxis
              type='category'
              dataKey='patientId'
              width={90}
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={{ stroke: 'var(--border)' }}
            />
            <Tooltip
              formatter={(value: number) => [value, 'Sessions']}
              labelFormatter={(label, payload) => {
                const fullId = payload?.[0]?.payload?.fullPatientId || label
                return `Patient ID: ${fullId}`
              }}
              cursor={{
                fill: 'color-mix(in oklab, var(--accent) 35%, transparent)',
              }}
              contentStyle={{
                backgroundColor: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                boxShadow:
                  '0 10px 10px color-mix(in oklab, var(--foreground) 10%, transparent)',
              }}
              labelStyle={{ color: 'var(--muted-foreground)' }}
            />
            <Legend wrapperStyle={{ color: 'var(--muted-foreground)' }} />
            <Bar
              dataKey='sessions'
              fill='var(--chart-2)'
              name='Sessions'
              radius={[0, 8, 8, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
