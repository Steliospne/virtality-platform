import {
  formatCount,
  formatDurationMinutes,
  formatProgressDelta,
  formatProgressQuality,
  formatTherapyDose,
} from './effectiveness-report-formatters'

function pluralSuffix(count: number): string {
  return count === 1 ? '' : 's'
}

function wasOrWere(count: number): 'was' | 'were' {
  return count === 1 ? 'was' : 'were'
}

export const EFFECTIVENESS_REPORT_COPY = {
  pageTitle: 'Product Adoption & Engagement',
  pageSubtitle:
    'Executive snapshot of adoption, engagement, therapy volume, and progress trends from completed therapy sessions among non-deleted patients, grouped by care-team owner. Exercise completion and therapy volume are product-derived usage proxies—not validated clinical outcome measures.',
  navLabel: 'Adoption & Engagement',
  dashboardLinkLabel: 'Adoption & Engagement',
  disclaimer:
    'These metrics describe product usage and in-session exercise completion. They are product-derived proxies, not evidence of clinical treatment outcomes.',
  loadError: 'Failed to load adoption and engagement report.',
  ownerFilterLabel: 'Patient owner',
  kpi: {
    activePatients: {
      title: 'Active Therapy Patients',
      description:
        'Patients who completed at least one therapy session in range',
    },
    patientActivationRate: {
      title: 'Patient Adoption Rate',
      description: 'Share of scoped patients who completed therapy in range',
    },
    completedSessions: {
      title: 'Completed Therapy Sessions',
      description: 'Sessions finished with a completion timestamp in range',
    },
    averageSessionsPerActivePatient: {
      title: 'Avg. Sessions per Patient',
      description: 'Completed sessions divided by active therapy patients',
    },
    progressQuality: {
      title: 'Exercise Completion Score',
      description:
        'Average exercise completion (%) from in-session data—a product progress proxy',
    },
    progressQualityDelta: {
      title: 'Completion Trend',
      description:
        'Change from earliest to latest session with completion data in range',
    },
    totalTherapyVolume: {
      title: 'Total Therapy Volume',
      description:
        'Sum of sets × reps × hold time × speed—a therapy volume proxy, not clinical dosage',
    },
    averageTherapyVolume: {
      title: 'Avg. Volume per Session',
      description:
        'Average therapy volume per session with exercise settings in range',
    },
    averageSessionDuration: {
      title: 'Avg. Session Length',
      description: 'Average minutes from session start to completion',
    },
  },
  charts: {
    progressQuality: {
      title: 'Exercise Completion Trend',
      description:
        'Weekly average exercise completion from completed sessions. Product usage proxy, not a validated clinical outcome measure.',
      emptyState:
        'No usable exercise completion data for the selected date range.',
      tooltipNoData: 'No completion data',
      tooltipLabel: 'Average completion',
    },
    therapyVolume: {
      title: 'Therapy Volume Trend',
      description:
        'Weekly average therapy volume from completed session exercise settings. Volume proxy (sets × reps × hold time × speed), not a clinical dosage claim.',
      emptyState:
        'No completed sessions with exercise settings for the selected date range.',
      tooltipNoData: 'No volume data',
      tooltipLabel: 'Average volume',
    },
    engagementByOwner: {
      title: 'Engagement by Owner',
      description:
        'Adoption and completed session volume grouped by patient owner',
      emptyState: 'No owner activity for the selected date range.',
      columns: {
        owner: 'Owner',
        activePatients: 'Active patients',
        adoptionRate: 'Adoption rate',
        completedSessions: 'Completed sessions',
      },
    },
  },
} as const

type AdoptionPeriodSummaryInput = {
  hasSessionActivity: boolean
  activePatients: number
  totalPatients: number
  rangeLabel: string
}

type ProgressQualitySummaryInput = {
  sessionsWithProgressData: number
  sessionsMissingProgressData: number
  averageProgressQualityPercent: number | null
  progressQualityDeltaPercent: number | null
}

type TherapyVolumeSummaryInput = {
  sessionsWithDoseData: number
  sessionsMissingDoseData: number
  totalTherapyDose: number
  averageTherapyDosePerSession: number | null
  averageSessionDurationMinutes: number | null
}

export function collectEffectivenessReportCopySurfaces(): string[] {
  const { kpi, charts, ...staticCopy } = EFFECTIVENESS_REPORT_COPY

  const kpiSurfaces = Object.values(kpi).flatMap(({ title, description }) => [
    title,
    description,
  ])

  const chartSurfaces = Object.values(charts).flatMap((chart) => {
    const base = [chart.title, chart.description, chart.emptyState]

    if ('columns' in chart) {
      return [...base, ...Object.values(chart.columns)]
    }

    return [...base, chart.tooltipNoData, chart.tooltipLabel]
  })

  return [
    staticCopy.pageTitle,
    staticCopy.pageSubtitle,
    staticCopy.navLabel,
    staticCopy.dashboardLinkLabel,
    staticCopy.disclaimer,
    staticCopy.loadError,
    staticCopy.ownerFilterLabel,
    ...kpiSurfaces,
    ...chartSurfaces,
  ]
}

export function buildAdoptionPeriodSummary(
  input: AdoptionPeriodSummaryInput,
): string {
  if (!input.hasSessionActivity) {
    return `No completed therapy sessions were recorded between ${input.rangeLabel}.`
  }

  return `Between ${input.rangeLabel}, ${formatCount(input.activePatients)} of ${formatCount(input.totalPatients)} scoped patients completed at least one therapy session, showing adoption and engagement through the product.`
}

export function buildProgressQualitySummary(
  input: ProgressQualitySummaryInput,
): string {
  if (input.sessionsWithProgressData === 0) {
    return 'No completed sessions in range included usable exercise completion data for this product progress proxy.'
  }

  const deltaText =
    input.progressQualityDeltaPercent === null
      ? 'Not enough sessions with completion data to compare first vs latest completion trend.'
      : `Completion trend changed by ${formatProgressDelta(input.progressQualityDeltaPercent)} from first to latest session in range.`

  const missingCount = input.sessionsMissingProgressData
  const missingText =
    missingCount > 0
      ? ` ${formatCount(missingCount)} completed session${pluralSuffix(missingCount)} lacked usable completion data and ${wasOrWere(missingCount)} excluded from this product progress proxy.`
      : ''

  const sessionCount = input.sessionsWithProgressData
  return `Average exercise completion was ${formatProgressQuality(input.averageProgressQualityPercent)} across ${formatCount(sessionCount)} session${pluralSuffix(sessionCount)} with usable in-session data. ${deltaText}${missingText}`
}

export function buildTherapyVolumeSummary(
  input: TherapyVolumeSummaryInput,
): string {
  if (input.sessionsWithDoseData === 0) {
    return 'No completed sessions in range included exercise settings for therapy volume.'
  }

  const missingCount = input.sessionsMissingDoseData
  const missingDoseText =
    missingCount > 0
      ? ` ${formatCount(missingCount)} completed session${pluralSuffix(missingCount)} lacked exercise settings and ${wasOrWere(missingCount)} excluded from volume metrics.`
      : ''

  const durationText =
    input.averageSessionDurationMinutes === null
      ? 'Average session length was unavailable for completed sessions in range.'
      : `Average completed session length was ${formatDurationMinutes(input.averageSessionDurationMinutes)}.`

  return `Total therapy volume was ${formatTherapyDose(input.totalTherapyDose)} with an average of ${formatTherapyDose(input.averageTherapyDosePerSession)} per session with exercise settings. ${durationText}${missingDoseText}`
}
