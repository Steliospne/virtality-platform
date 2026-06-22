'use client'

import { EFFECTIVENESS_REPORT_COPY } from '@/lib/effectiveness-report-copy'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@virtality/ui/components/card'
import { addDays, format } from 'date-fns'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type TherapyIntensityTrendPoint = {
  bucketStart: string
  averageTherapyDose: number | null
  sessionsWithDose: number
}

interface EffectivenessTherapyIntensityChartProps {
  data: TherapyIntensityTrendPoint[]
}

const parseIsoDate = (value: string): Date => new Date(`${value}T00:00:00`)

const formatWeekLabel = (bucketStart: string): string => {
  const start = parseIsoDate(bucketStart)
  const end = addDays(start, 6)
  return `${format(start, 'dd/MM')}-${format(end, 'dd/MM')}`
}

const formatDoseValue = (value: number): string =>
  value.toLocaleString(undefined, {
    maximumFractionDigits: 1,
  })

export function EffectivenessTherapyIntensityChart({
  data,
}: EffectivenessTherapyIntensityChartProps) {
  const chartData = data.map((point) => ({
    ...point,
    label: formatWeekLabel(point.bucketStart),
    dose:
      point.averageTherapyDose === null ? undefined : point.averageTherapyDose,
  }))
  const hasDose = chartData.some((point) => point.sessionsWithDose > 0)
  const chartCopy = EFFECTIVENESS_REPORT_COPY.charts.therapyVolume

  return (
    <Card className='shadow-sm transition-shadow hover:shadow-md'>
      <CardHeader className='pb-4'>
        <CardTitle className='text-base font-semibold'>
          {chartCopy.title}
        </CardTitle>
        <CardDescription>{chartCopy.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasDose ? (
          <div className='text-muted-foreground flex h-[320px] items-center justify-center text-sm'>
            {chartCopy.emptyState}
          </div>
        ) : (
          <ResponsiveContainer width='100%' height={320}>
            <LineChart data={chartData}>
              <CartesianGrid
                stroke='var(--border)'
                strokeDasharray='3 3'
                opacity={0.55}
              />
              <XAxis
                dataKey='label'
                angle={-45}
                textAnchor='end'
                height={90}
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={{ stroke: 'var(--border)' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={{ stroke: 'var(--border)' }}
                tickFormatter={(value) => formatDoseValue(value)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                }}
                labelFormatter={(_, payload) => {
                  const bucketStart = payload?.[0]?.payload?.bucketStart
                  if (typeof bucketStart !== 'string') {
                    return ''
                  }
                  const weekStart = parseIsoDate(bucketStart)
                  const weekEnd = addDays(weekStart, 6)
                  return `${format(weekStart, 'dd MMM yyyy')} - ${format(weekEnd, 'dd MMM yyyy')}`
                }}
                formatter={(value, _name, item) => {
                  const sessionsWithDose = item.payload.sessionsWithDose
                  if (typeof value !== 'number') {
                    return [chartCopy.tooltipNoData, chartCopy.tooltipLabel]
                  }
                  return [
                    `${formatDoseValue(value)} across ${sessionsWithDose} session${sessionsWithDose === 1 ? '' : 's'}`,
                    chartCopy.tooltipLabel,
                  ]
                }}
              />
              <Line
                type='monotone'
                dataKey='dose'
                stroke='var(--chart-4)'
                strokeWidth={2}
                dot={{ r: 4 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
