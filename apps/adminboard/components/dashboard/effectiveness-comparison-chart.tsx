'use client'

import { EFFECTIVENESS_REPORT_COPY } from '@/lib/effectiveness-report-copy'
import { formatPercent } from '@/lib/effectiveness-report-formatters'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@virtality/ui/components/card'

type EffectivenessComparisonRow = {
  userLabel: string
  activePatients: number
  completedSessions: number
  patientActivationRatePercent: number | null
}

interface EffectivenessComparisonChartProps {
  data: EffectivenessComparisonRow[]
}

export function EffectivenessComparisonChart({
  data,
}: EffectivenessComparisonChartProps) {
  const engagementCopy = EFFECTIVENESS_REPORT_COPY.charts.engagementByOwner
  const { columns } = engagementCopy

  return (
    <Card className='shadow-sm transition-shadow hover:shadow-md'>
      <CardHeader className='pb-4'>
        <CardTitle className='text-base font-semibold'>
          {engagementCopy.title}
        </CardTitle>
        <CardDescription>{engagementCopy.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className='text-muted-foreground flex h-[320px] items-center justify-center text-sm'>
            {engagementCopy.emptyState}
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full min-w-[640px] text-left text-sm'>
              <thead>
                <tr className='border-b'>
                  <th className='text-muted-foreground px-3 py-2 font-medium'>
                    {columns.owner}
                  </th>
                  <th className='text-muted-foreground px-3 py-2 font-medium'>
                    {columns.activePatients}
                  </th>
                  <th className='text-muted-foreground px-3 py-2 font-medium'>
                    {columns.adoptionRate}
                  </th>
                  <th className='text-muted-foreground px-3 py-2 font-medium'>
                    {columns.completedSessions}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr
                    key={`${row.userLabel}-${row.activePatients}-${row.completedSessions}`}
                    className='border-b last:border-b-0'
                  >
                    <td className='px-3 py-3 font-medium'>{row.userLabel}</td>
                    <td className='px-3 py-3'>{row.activePatients}</td>
                    <td className='px-3 py-3'>
                      {formatPercent(row.patientActivationRatePercent)}
                    </td>
                    <td className='px-3 py-3'>{row.completedSessions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
