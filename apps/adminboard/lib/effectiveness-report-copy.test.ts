import { describe, expect, it } from 'vitest'
import {
  EFFECTIVENESS_REPORT_COPY,
  buildAdoptionPeriodSummary,
  buildProgressQualitySummary,
  buildTherapyVolumeSummary,
  collectEffectivenessReportCopySurfaces,
} from './effectiveness-report-copy'

const UNSUPPORTED_CLINICAL_CLAIM_PATTERNS = [
  /\befficacy\b/i,
  /\btherapeutic benefit\b/i,
  /\bclinical improvement\b/i,
  /\btreatment effectiveness\b/i,
  /\bvalidated clinical outcome\b/i,
  /\bclinical dosage\b/i,
]

const EXECUTIVE_JARGON_PATTERNS = [/\bpayloads?\b/i, /\brep progress\b/i]

const hasUnsupportedClinicalClaim = (text: string): boolean => {
  for (const pattern of UNSUPPORTED_CLINICAL_CLAIM_PATTERNS) {
    const match = pattern.exec(text)
    if (!match || match.index === undefined) {
      continue
    }

    const prefix = text.slice(Math.max(0, match.index - 40), match.index)
    if (/\b(not|no|never|without)\b/i.test(prefix)) {
      continue
    }

    return true
  }

  return false
}

describe('effectiveness report executive copy', () => {
  it('exposes KPI labels and chart titles for non-clinician readers', () => {
    expect(EFFECTIVENESS_REPORT_COPY.kpi.activePatients.title).toBe(
      'Active Therapy Patients',
    )
    expect(EFFECTIVENESS_REPORT_COPY.kpi.patientActivationRate.title).toBe(
      'Patient Adoption Rate',
    )
    expect(EFFECTIVENESS_REPORT_COPY.kpi.progressQuality.title).toBe(
      'Exercise Completion Score',
    )
    expect(EFFECTIVENESS_REPORT_COPY.kpi.progressQualityDelta.title).toBe(
      'Completion Trend',
    )
    expect(EFFECTIVENESS_REPORT_COPY.charts.progressQuality.title).toBe(
      'Exercise Completion Trend',
    )
    expect(EFFECTIVENESS_REPORT_COPY.charts.therapyVolume.title).toBe(
      'Therapy Volume Trend',
    )
  })

  it('frames progress quality and therapy volume as product-derived proxies', () => {
    const proxyCopy = [
      EFFECTIVENESS_REPORT_COPY.pageSubtitle,
      EFFECTIVENESS_REPORT_COPY.disclaimer,
      EFFECTIVENESS_REPORT_COPY.kpi.progressQuality.description,
      EFFECTIVENESS_REPORT_COPY.kpi.totalTherapyVolume.description,
      EFFECTIVENESS_REPORT_COPY.charts.progressQuality.description,
      EFFECTIVENESS_REPORT_COPY.charts.therapyVolume.description,
    ]

    for (const text of proxyCopy) {
      expect(text.toLowerCase()).toMatch(/proxy|product-derived|product usage/)
    }
  })

  it('highlights adoption, engagement, therapy volume, and progress trends', () => {
    const intro = EFFECTIVENESS_REPORT_COPY.pageSubtitle.toLowerCase()

    expect(intro).toContain('adoption')
    expect(intro).toContain('engagement')
    expect(intro).toContain('therapy volume')
    expect(intro).toContain('progress trends')
  })

  it('avoids unsupported clinical claims across audited copy surfaces', () => {
    for (const surface of collectEffectivenessReportCopySurfaces()) {
      expect(hasUnsupportedClinicalClaim(surface)).toBe(false)
    }
  })

  it('avoids clinician-only jargon in audited copy surfaces', () => {
    for (const surface of collectEffectivenessReportCopySurfaces()) {
      for (const pattern of EXECUTIVE_JARGON_PATTERNS) {
        expect(surface).not.toMatch(pattern)
      }
    }
  })

  it('builds adoption summary copy for active and empty periods', () => {
    expect(
      buildAdoptionPeriodSummary({
        hasSessionActivity: true,
        activePatients: 12,
        totalPatients: 20,
        rangeLabel: '01 Jan 2026 and 31 Jan 2026',
      }),
    ).toBe(
      'Between 01 Jan 2026 and 31 Jan 2026, 12 of 20 scoped patients completed at least one therapy session, showing adoption and engagement through the product.',
    )

    expect(
      buildAdoptionPeriodSummary({
        hasSessionActivity: false,
        activePatients: 0,
        totalPatients: 20,
        rangeLabel: '01 Jan 2026 and 31 Jan 2026',
      }),
    ).toBe(
      'No completed therapy sessions were recorded between 01 Jan 2026 and 31 Jan 2026.',
    )
  })

  it('builds progress quality summary with proxy framing and honest exclusions', () => {
    expect(
      buildProgressQualitySummary({
        sessionsWithProgressData: 0,
        sessionsMissingProgressData: 2,
        averageProgressQualityPercent: null,
        progressQualityDeltaPercent: null,
      }),
    ).toBe(
      'No completed sessions in range included usable exercise completion data for this product progress proxy.',
    )

    expect(
      buildProgressQualitySummary({
        sessionsWithProgressData: 3,
        sessionsMissingProgressData: 1,
        averageProgressQualityPercent: 72.5,
        progressQualityDeltaPercent: 4.2,
      }),
    ).toBe(
      'Average exercise completion was 72.5% across 3 sessions with usable in-session data. Completion trend changed by +4.2 pts from first to latest session in range. 1 completed session lacked usable completion data and was excluded from this product progress proxy.',
    )
  })

  it('builds therapy volume summary with volume-proxy framing', () => {
    expect(
      buildTherapyVolumeSummary({
        sessionsWithDoseData: 0,
        sessionsMissingDoseData: 0,
        totalTherapyDose: 0,
        averageTherapyDosePerSession: null,
        averageSessionDurationMinutes: null,
      }),
    ).toBe(
      'No completed sessions in range included exercise settings for therapy volume.',
    )

    expect(
      buildTherapyVolumeSummary({
        sessionsWithDoseData: 4,
        sessionsMissingDoseData: 1,
        totalTherapyDose: 1200,
        averageTherapyDosePerSession: 300,
        averageSessionDurationMinutes: 28.5,
      }),
    ).toBe(
      'Total therapy volume was 1,200 with an average of 300 per session with exercise settings. Average completed session length was 28.5 min. 1 completed session lacked exercise settings and was excluded from volume metrics.',
    )
  })
})
