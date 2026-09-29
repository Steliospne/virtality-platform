'use client'

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { format } from 'date-fns'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import type { HomeSessionDay } from '@/lib/home-sessions-summary'

const chartConfig = {
  count: {
    label: 'Sessions',
    theme: { light: 'hsl(160 95% 30%)', dark: 'hsl(150 90% 45%)' },
  },
} satisfies ChartConfig

const SessionsChart = ({ days }: { days: HomeSessionDay[] }) => {
  const max = Math.max(4, ...days.map((day) => day.count))

  return (
    <ChartContainer
      config={chartConfig}
      className='aspect-auto h-38 w-full'
      role='img'
      aria-label='Sessions per day over the last seven days'
    >
      <AreaChart
        data={days}
        margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
      >
        <CartesianGrid vertical={false} strokeDasharray='0' />
        <XAxis
          dataKey='label'
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={11}
        />
        <YAxis
          domain={[0, max]}
          allowDecimals={false}
          tickCount={3}
          tickLine={false}
          axisLine={false}
          fontSize={11}
        />
        <ChartTooltip
          cursor={{ strokeDasharray: '2 3' }}
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const day = payload[0]?.payload as HomeSessionDay | undefined
                return day ? format(day.date, 'EEE d MMM') : ''
              }}
            />
          }
        />
        <Area
          dataKey='count'
          type='monotone'
          stroke='var(--color-count)'
          strokeWidth={2}
          fill='var(--color-count)'
          fillOpacity={0.12}
          dot={false}
          activeDot={{ r: 5, strokeWidth: 2 }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  )
}

export default SessionsChart
