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

type ProgressQualityTrendPoint = {
  bucketStart: string
  averageProgressQualityPercent: number | null
  sessionsWithProgress: number
}

interface EffectivenessProgressQualityChartProps {
  data: ProgressQualityTrendPoint[]
}

const parseIsoDate = (value: string): Date => new Date(`${value}T00:00:00`)

const formatWeekLabel = (bucketStart: string): string => {
  const start = parseIsoDate(bucketStart)
  const end = addDays(start, 6)
  return `${format(start, 'dd/MM')}-${format(end, 'dd/MM')}`
}

export function EffectivenessProgressQualityChart({
  data,
}: EffectivenessProgressQualityChartProps) {
  const chartData = data.map((point) => ({
    ...point,
    label: formatWeekLabel(point.bucketStart),
    quality:
      point.averageProgressQualityPercent === null
        ? undefined
        : point.averageProgressQualityPercent,
  }))
  const hasProgress = chartData.some((point) => point.sessionsWithProgress > 0)
  const chartCopy = EFFECTIVENESS_REPORT_COPY.charts.progressQuality

  return (
    <Card className='shadow-sm transition-shadow hover:shadow-md'>
      <CardHeader className='pb-4'>
        <CardTitle className='text-base font-semibold'>
          {chartCopy.title}
        </CardTitle>
        <CardDescription>{chartCopy.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasProgress ? (
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
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={{ stroke: 'var(--border)' }}
                tickFormatter={(value) => `${value}%`}
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
                  const sessionsWithProgress = item.payload.sessionsWithProgress
                  if (typeof value !== 'number') {
                    return [chartCopy.tooltipNoData, chartCopy.tooltipLabel]
                  }
                  return [
                    `${value}% across ${sessionsWithProgress} session${sessionsWithProgress === 1 ? '' : 's'}`,
                    chartCopy.tooltipLabel,
                  ]
                }}
              />
              <Line
                type='monotone'
                dataKey='quality'
                stroke='var(--chart-3)'
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
