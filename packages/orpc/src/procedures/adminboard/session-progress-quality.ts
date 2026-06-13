export type ProgressDataPoint = {
  rep?: number
  [key: string]: number | undefined
}

export type SessionProgressDataRow = {
  value: string
}

const roundOneDecimal = (value: number): number => Math.round(value * 10) / 10

const getScoreKeys = (point: ProgressDataPoint): string[] => {
  const keys = Object.keys(point)
  if (keys.length <= 1) {
    return []
  }

  const first = keys[0]
  return keys.filter((key) => key !== first)
}

const repScoreFromPoint = (point: ProgressDataPoint): number => {
  const keys = getScoreKeys(point)
  if (keys.length === 0) {
    return 0
  }

  let sum = 0
  for (const key of keys) {
    const value = point[key]
    if (typeof value === 'number') {
      sum += value
    }
  }

  return sum / keys.length
}

export function parseSessionProgressValue(value: string): ProgressDataPoint[] {
  try {
    const parsed = JSON.parse(value) as ProgressDataPoint[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/** Average rep progress (%) for one exercise payload. */
export function getExerciseProgressQualityPercent(
  valueJson: string,
): number | null {
  const points = parseSessionProgressValue(valueJson)
  if (points.length === 0) {
    return null
  }

  let sum = 0
  let count = 0
  for (const point of points) {
    sum += repScoreFromPoint(point)
    count += 1
  }

  if (count === 0) {
    return null
  }

  return roundOneDecimal(sum / count)
}

/** Session-level average exercise quality from progress payloads. */
export function getSessionProgressQualityPercent(
  sessionData: SessionProgressDataRow[],
): number | null {
  const exerciseScores = sessionData
    .map((row) => getExerciseProgressQualityPercent(row.value))
    .filter((score): score is number => score !== null)

  if (exerciseScores.length === 0) {
    return null
  }

  return roundOneDecimal(
    exerciseScores.reduce((total, score) => total + score, 0) /
      exerciseScores.length,
  )
}

export function getProgressQualityDeltaPercent(
  sessionQualities: Array<{ completedAt: string; qualityPercent: number }>,
): number | null {
  if (sessionQualities.length < 2) {
    return null
  }

  const sorted = [...sessionQualities].sort((left, right) =>
    left.completedAt.localeCompare(right.completedAt),
  )
  const first = sorted[0]?.qualityPercent
  const latest = sorted[sorted.length - 1]?.qualityPercent

  if (first === undefined || latest === undefined) {
    return null
  }

  return roundOneDecimal(latest - first)
}
