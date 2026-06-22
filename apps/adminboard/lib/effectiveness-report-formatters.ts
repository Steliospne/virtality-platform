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
  return formatPercent(value)
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
