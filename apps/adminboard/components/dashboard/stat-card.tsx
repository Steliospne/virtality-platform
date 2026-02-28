import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CSSProperties, ReactNode } from 'react'
import { CalendarDays, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tone = 'blue' | 'teal' | 'violet' | 'amber' | 'slate'

interface StatCardProps {
  title: string
  value: number
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

function getDefaultToneAndIcon(title: string): {
  tone: Tone
  icon?: ReactNode
} {
  if (title.toLowerCase().includes('patient')) {
    return { tone: 'blue', icon: <Users className='size-4' /> }
  }
  if (title.toLowerCase().includes('session')) {
    return { tone: 'teal', icon: <CalendarDays className='size-4' /> }
  }
  return { tone: 'slate' }
}

export function StatCard({
  title,
  value,
  description,
  tone,
  icon,
}: StatCardProps) {
  const defaults = getDefaultToneAndIcon(title)
  const resolvedTone = tone ?? defaults.tone
  const resolvedIcon = icon ?? defaults.icon

  return (
    <Card
      className={cn(
        'relative overflow-hidden',
        'transition-[border-color,box-shadow,transform] duration-200',
        'hover:shadow-md',
      )}
      style={
        {
          '--stat-accent': toneToColor[resolvedTone],
        } as CSSProperties
      }
    >
      {/* Accent rail */}
      <div className='pointer-events-none absolute inset-y-0 left-0 w-1 bg-(--stat-accent)' />

      {/* Soft accent wash */}
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
          {resolvedIcon ? (
            <div
              className='rounded-md p-2'
              style={{
                backgroundColor:
                  'color-mix(in oklab, var(--stat-accent) 14%, transparent)',
                color: 'var(--stat-accent)',
              }}
            >
              {resolvedIcon}
            </div>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className='relative pt-0'>
        <div className='text-3xl font-semibold tracking-tight'>
          {value.toLocaleString()}
        </div>
        {description ? (
          <p className='text-muted-foreground mt-1 text-xs leading-relaxed'>
            {description}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
