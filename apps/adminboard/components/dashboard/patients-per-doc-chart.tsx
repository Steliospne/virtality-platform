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

interface PatientsPerDocChartProps {
  data: { name: string; totalPatients: number }[]
}

export function PatientsPerDocChart({ data }: PatientsPerDocChartProps) {
  return (
    <Card className='shadow-sm transition-shadow hover:shadow-md'>
      <CardHeader className='pb-4'>
        <CardTitle className='text-base font-semibold'>
          Patients per Doctor
        </CardTitle>
        <CardDescription>
          Distribution of unique patients across doctors
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width='100%' height={350}>
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              stroke='var(--border)'
              strokeDasharray='3 3'
              opacity={0.55}
            />
            <XAxis
              dataKey='name'
              angle={-45}
              textAnchor='end'
              height={100}
              tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
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
                  '0 10px 10px color-mix(in oklab, var(--foreground) 10%, transparent)',
              }}
              labelStyle={{ color: 'var(--muted-foreground)' }}
            />
            <Legend wrapperStyle={{ color: 'var(--muted-foreground)' }} />
            <Bar
              dataKey='totalPatients'
              fill='var(--chart-1)'
              name='Total Patients'
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
