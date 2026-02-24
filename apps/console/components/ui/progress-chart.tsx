'use client'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { useTheme } from 'next-themes'
import { useMemo } from 'react'
import { ProgressDataPoint } from '@/types/models'

interface ChartProps {
  data: ProgressDataPoint[]
  className?: string
}

const Chart = ({ data, className }: ChartProps) => {
  const { resolvedTheme } = useTheme()

  const dataKeys = Object.keys(data[0] ?? {})

  const length = dataKeys.length

  const isEmpty = data.length === 0

  const chartData = isEmpty
    ? [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ]
    : data

  const chartConfig: ChartConfig = useMemo(
    () =>
      Object.fromEntries(
        Array.from({ length }, (_, i) => {
          if (i === 0) {
            const key = `${dataKeys[0]}`
            return [
              key,
              {
                label: key,
              },
            ]
          }
          if (length === 2) {
            const key = dataKeys[1]
            return [
              key,
              {
                label: dataKeys[1],
                color: `hsl(var(--chart-${1}))`,
              },
            ]
          }
          const key = `${dataKeys[1].split('_')[0]}_${i}`
          return [
            key,
            {
              label: `${dataKeys[1].split('_')[0]} ${i}`,
              color: `hsl(var(--chart-${i}))`,
            },
          ]
        }),
      ),
    [length, dataKeys],
  )

  return (
    <ChartContainer config={chartConfig} className={className}>
      <AreaChart
        accessibilityLayer
        data={chartData}
        margin={{
          left: 12,
          right: 12,
        }}
      >
        <CartesianGrid vertical={false} />
        {isEmpty ? (
          <XAxis
            type='number'
            domain={[0, 100]}
            ticks={[0, 20, 40, 60, 80, 100]}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fill: resolvedTheme === 'dark' ? 'white' : 'black' }}
            allowDecimals={false}
            dataKey='x'
          />
        ) : (
          <XAxis
            dataKey={dataKeys[0]}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fill: resolvedTheme === 'dark' ? 'white' : 'black' }}
          />
        )}
        {isEmpty ? (
          <YAxis
            tickCount={5}
            tick={{ fill: resolvedTheme === 'dark' ? 'white' : 'black' }}
            domain={[0, 100]}
            ticks={[0, 20, 40, 60, 80, 100]}
            allowDataOverflow
            tickFormatter={(value) => value + '%'}
          />
        ) : (
          <YAxis
            tickCount={5}
            tick={{ fill: resolvedTheme === 'dark' ? 'white' : 'black' }}
            domain={['auto', 'auto']}
            allowDataOverflow
            tickFormatter={(value) => value + '%'}
          />
        )}
        {!isEmpty && (
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent labelKey={dataKeys[0]} symbol='%' />}
          />
        )}
        <defs>
          {!isEmpty &&
            dataKeys[0] &&
            dataKeys.map((key, index) => {
              if (index === 0) return
              return (
                <linearGradient
                  key={index + 'line'}
                  id={`fill${key}`}
                  x1='0'
                  y1='0'
                  x2='0'
                  y2='1'
                >
                  <stop
                    offset='5%'
                    stopColor={`var(--color-${key})`}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset='95%'
                    stopColor={`var(--color-${key})`}
                    stopOpacity={0.1}
                  />
                </linearGradient>
              )
            })}
        </defs>
        {!isEmpty &&
          dataKeys[0] &&
          dataKeys.map((key, index) => {
            if (index === 0) return
            return (
              <Area
                key={index + 'area'}
                dataKey={`${key}`}
                type='bump'
                fill={`url(#fill${key})`}
                fillOpacity={0.4}
                stroke={`var(--color-${key})`}
              />
            )
          })}
        {!isEmpty && <ChartLegend content={<ChartLegendContent />} />}
      </AreaChart>
    </ChartContainer>
  )
}

export default Chart
