'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@virtality/ui/components/card'
import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Tone = 'blue' | 'teal' | 'violet' | 'amber' | 'slate'

interface EffectivenessMetricCardProps {
  title: string
  value: string
  description?: string
  tone?: Tone
  icon?: ReactNode
}

const toneToColor: Record<Tone, string> = {
  blue: 'var(--chart-1)',
  teal: 'var(--chart-2)',
  violet: 'var(--chart-5)',
  amber: 'var(--chart-4)',
  slate: 'var(--foreground)',
}

export function EffectivenessMetricCard({
  title,
  value,
  description,
  tone = 'slate',
  icon,
}: EffectivenessMetricCardProps) {
  return (
    <Card
      className={cn(
        'relative overflow-hidden',
        'transition-[border-color,box-shadow,transform] duration-200',
        'hover:shadow-md',
      )}
      style={
        {
          '--stat-accent': toneToColor[tone],
        } as CSSProperties
      }
    >
      <div className='pointer-events-none absolute inset-y-0 left-0 w-1 bg-(--stat-accent)' />
      <div
        className='pointer-events-none absolute inset-0 opacity-[0.06]'
        style={{
          background:
            'linear-gradient(135deg, transparent 45%, var(--stat-accent) 160%)',
        }}
      />

      <CardHeader className='relative pb-3'>
        <div className='flex items-start justify-between gap-3'>
          <CardTitle className='text-muted-foreground text-sm font-medium'>
            {title}
          </CardTitle>
          {icon ? (
            <div
              className='rounded-md p-2'
              style={{
                backgroundColor:
                  'color-mix(in oklab, var(--stat-accent) 14%, transparent)',
                color: 'var(--stat-accent)',
              }}
            >
              {icon}
            </div>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className='relative pt-0'>
        <div className='text-3xl font-semibold tracking-tight'>{value}</div>
        {description ? (
          <p className='text-muted-foreground mt-1 text-xs leading-relaxed'>
            {description}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

export function formatCount(value: number): string {
  return value.toLocaleString()
}

export function formatPercent(value: number | null): string {
  if (value === null) {
    return '—'
  }

  return `${value}%`
}

export function formatAverage(value: number | null): string {
  if (value === null) {
    return '—'
  }

  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })
}

export function formatProgressQuality(value: number | null): string {
  if (value === null) {
    return '—'
  }

  return `${value}%`
}

export function formatProgressDelta(value: number | null): string {
  if (value === null) {
    return '—'
  }

  const prefix = value > 0 ? '+' : ''
  return `${prefix}${value} pts`
}

export function formatTherapyDose(value: number | null): string {
  if (value === null) {
    return '—'
  }

  return value.toLocaleString(undefined, {
    maximumFractionDigits: 1,
  })
}

export function formatDurationMinutes(value: number | null): string {
  if (value === null) {
    return '—'
  }

  return `${value.toLocaleString(undefined, {
    maximumFractionDigits: 1,
  })} min`
}
