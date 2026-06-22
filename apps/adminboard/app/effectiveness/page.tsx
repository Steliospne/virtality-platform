'use client'

import { EffectivenessComparisonChart } from '@/components/dashboard/effectiveness-comparison-chart'
import { EffectivenessProgressQualityChart } from '@/components/dashboard/effectiveness-progress-quality-chart'
import { EffectivenessTherapyIntensityChart } from '@/components/dashboard/effectiveness-therapy-intensity-chart'
import { EffectivenessMetricCard } from '@/components/dashboard/effectiveness-metric-card'
import {
  formatAverage,
  formatCount,
  formatDurationMinutes,
  formatPercent,
  formatProgressDelta,
  formatProgressQuality,
  formatTherapyDose,
} from '@/lib/effectiveness-report-formatters'
import {
  EFFECTIVENESS_REPORT_COPY,
  buildAdoptionPeriodSummary,
  buildProgressQualitySummary,
  buildTherapyVolumeSummary,
} from '@/lib/effectiveness-report-copy'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useEffectivenessReport } from '@virtality/react-query'
import { addDays, format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { type DateRange } from 'react-day-picker'

const MIN_WINDOW_DAYS = 3
const ALL_OWNERS_VALUE = 'all'
const UNKNOWN_OWNER_VALUE = '__unknown_owner__'

const ownerSelectValue = (userId: string | null): string =>
  userId === null ? UNKNOWN_OWNER_VALUE : userId

const ownerFilterFromSelectValue = (
  value: string,
): string | null | undefined => {
  if (value === ALL_OWNERS_VALUE) {
    return undefined
  }

  if (value === UNKNOWN_OWNER_VALUE) {
    return null
  }

  return value
}

const getDefaultRange = (): { from: Date; to: Date } => {
  const to = new Date()
  to.setHours(0, 0, 0, 0)
  const from = addDays(to, -29)
  return { from, to }
}

const formatDateRangeLabel = (from: Date, to: Date): string =>
  `${format(from, 'dd/MM')} - ${format(to, 'dd/MM')}`

const EffectivenessReportPage = () => {
  const { from: defaultFrom, to: defaultTo } = getDefaultRange()

  const [appliedRange, setAppliedRange] = useState<DateRange>({
    from: defaultFrom,
    to: defaultTo,
  })
  const [pickerRange, setPickerRange] = useState<DateRange | undefined>({
    from: defaultFrom,
    to: defaultTo,
  })
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [selectedOwner, setSelectedOwner] = useState(ALL_OWNERS_VALUE)

  const rangeFrom = appliedRange.from ?? defaultFrom
  const rangeTo = appliedRange.to ?? defaultTo
  const ownerUserId = ownerFilterFromSelectValue(selectedOwner)

  const { data, isLoading, isError } = useEffectivenessReport({
    from: rangeFrom,
    to: rangeTo,
    ownerUserId,
  })

  const comparisonRows = useMemo(() => {
    if (!data?.byUser || selectedOwner !== ALL_OWNERS_VALUE) {
      return []
    }

    return data.byUser.filter(
      (row) => row.activePatients > 0 || row.completedSessions > 0,
    )
  }, [data?.byUser, selectedOwner])

  const selectedOwnerLabel = useMemo(() => {
    if (selectedOwner === ALL_OWNERS_VALUE) {
      return 'All owners'
    }

    return (
      data?.ownerOptions.find(
        (option) => ownerSelectValue(option.userId) === selectedOwner,
      )?.userLabel ?? 'Selected owner'
    )
  }, [data?.ownerOptions, selectedOwner])

  const applyPickerRange = () => {
    if (!pickerRange?.from || !pickerRange.to) {
      return
    }

    const from = new Date(pickerRange.from)
    const to = new Date(pickerRange.to)
    from.setHours(0, 0, 0, 0)
    to.setHours(0, 0, 0, 0)

    setAppliedRange({ from, to })
    setPickerRange({ from, to })
    setPopoverOpen(false)
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (isError || !data) {
    return (
      <div className='min-h-screen-with-header mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8'>
        <p className='text-sm text-red-600 dark:text-red-400'>
          {EFFECTIVENESS_REPORT_COPY.loadError}
        </p>
      </div>
    )
  }

  const summary = data.summary
  const progressQuality = data.progressQuality
  const therapyIntensity = data.therapyIntensity

  const rangeLabel = `${format(rangeFrom, 'dd MMM yyyy')} and ${format(rangeTo, 'dd MMM yyyy')}`

  const adoptionSummary = buildAdoptionPeriodSummary({
    hasSessionActivity: data.hasSessionActivity,
    activePatients: summary.activePatients,
    totalPatients: summary.totalPatients,
    rangeLabel,
  })

  const progressSummary = buildProgressQualitySummary({
    sessionsWithProgressData: progressQuality.sessionsWithProgressData,
    sessionsMissingProgressData: progressQuality.sessionsMissingProgressData,
    averageProgressQualityPercent:
      progressQuality.averageProgressQualityPercent,
    progressQualityDeltaPercent: progressQuality.progressQualityDeltaPercent,
  })

  const therapySummary = buildTherapyVolumeSummary({
    sessionsWithDoseData: therapyIntensity.sessionsWithDoseData,
    sessionsMissingDoseData: therapyIntensity.sessionsMissingDoseData,
    totalTherapyDose: therapyIntensity.totalTherapyDose,
    averageTherapyDosePerSession: therapyIntensity.averageTherapyDosePerSession,
    averageSessionDurationMinutes:
      therapyIntensity.averageSessionDurationMinutes,
  })

  const { kpi } = EFFECTIVENESS_REPORT_COPY

  return (
    <div className='min-h-screen-with-header mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 md:px-6 md:py-8'>
      <div className='flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
        <div className='min-w-0'>
          <h1 className='text-3xl font-semibold tracking-tight md:text-4xl'>
            {EFFECTIVENESS_REPORT_COPY.pageTitle}
          </h1>
          <p className='text-muted-foreground mt-2 max-w-3xl text-sm'>
            {EFFECTIVENESS_REPORT_COPY.pageSubtitle}
          </p>
        </div>

        <div className='flex flex-col gap-2 sm:flex-row sm:items-end'>
          <div className='flex flex-col gap-1.5'>
            <label
              htmlFor='owner-filter'
              className='text-muted-foreground text-xs font-medium'
            >
              {EFFECTIVENESS_REPORT_COPY.ownerFilterLabel}
            </label>
            <Select value={selectedOwner} onValueChange={setSelectedOwner}>
              <SelectTrigger
                id='owner-filter'
                className='min-w-[220px] justify-between'
              >
                <SelectValue placeholder='All owners' />
              </SelectTrigger>
              <SelectContent align='end'>
                <SelectItem value={ALL_OWNERS_VALUE}>All owners</SelectItem>
                {(data?.ownerOptions ?? []).map((option) => (
                  <SelectItem
                    key={ownerSelectValue(option.userId)}
                    value={ownerSelectValue(option.userId)}
                  >
                    {option.userLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Popover
            open={popoverOpen}
            onOpenChange={(open) => {
              setPopoverOpen(open)
              if (open) {
                setPickerRange(appliedRange)
              }
            }}
          >
            <PopoverTrigger asChild>
              <Button variant='outline' className='min-w-[180px] justify-start'>
                <CalendarIcon className='size-4' />
                {formatDateRangeLabel(rangeFrom, rangeTo)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-[450px] p-0' align='end'>
              <Calendar
                mode='range'
                defaultMonth={rangeFrom}
                selected={pickerRange}
                onSelect={setPickerRange}
                min={MIN_WINDOW_DAYS - 1}
                showOutsideDays={false}
                numberOfMonths={2}
                className='w-full'
                disabled={(date) =>
                  date > new Date() || date < new Date('1900-01-01')
                }
              />
              <div className='flex justify-end border-t p-3'>
                <Button
                  size='sm'
                  onClick={applyPickerRange}
                  disabled={!pickerRange?.from || !pickerRange.to}
                >
                  Apply
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <p className='text-muted-foreground text-sm'>
        {selectedOwner !== ALL_OWNERS_VALUE
          ? `Showing metrics for ${selectedOwnerLabel}.`
          : null}
        {selectedOwner !== ALL_OWNERS_VALUE ? ' ' : null}
        {adoptionSummary}
      </p>

      <p className='text-muted-foreground text-sm'>{progressSummary}</p>

      <p className='text-muted-foreground text-sm'>{therapySummary}</p>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'>
        <EffectivenessMetricCard
          title={kpi.activePatients.title}
          value={formatCount(summary.activePatients)}
          description={kpi.activePatients.description}
          tone='blue'
        />
        <EffectivenessMetricCard
          title={kpi.patientActivationRate.title}
          value={formatPercent(summary.patientActivationRatePercent)}
          description={kpi.patientActivationRate.description}
          tone='violet'
        />
        <EffectivenessMetricCard
          title={kpi.completedSessions.title}
          value={formatCount(summary.completedSessions)}
          description={kpi.completedSessions.description}
          tone='teal'
        />
        <EffectivenessMetricCard
          title={kpi.averageSessionsPerActivePatient.title}
          value={formatAverage(summary.averageSessionsPerActivePatient)}
          description={kpi.averageSessionsPerActivePatient.description}
          tone='amber'
        />
        <EffectivenessMetricCard
          title={kpi.progressQuality.title}
          value={formatProgressQuality(
            progressQuality.averageProgressQualityPercent,
          )}
          description={kpi.progressQuality.description}
          tone='slate'
        />
        <EffectivenessMetricCard
          title={kpi.progressQualityDelta.title}
          value={formatProgressDelta(
            progressQuality.progressQualityDeltaPercent,
          )}
          description={kpi.progressQualityDelta.description}
          tone='slate'
        />
        <EffectivenessMetricCard
          title={kpi.totalTherapyVolume.title}
          value={formatTherapyDose(therapyIntensity.totalTherapyDose)}
          description={kpi.totalTherapyVolume.description}
          tone='amber'
        />
        <EffectivenessMetricCard
          title={kpi.averageTherapyVolume.title}
          value={formatTherapyDose(
            therapyIntensity.averageTherapyDosePerSession,
          )}
          description={kpi.averageTherapyVolume.description}
          tone='teal'
        />
        <EffectivenessMetricCard
          title={kpi.averageSessionDuration.title}
          value={formatDurationMinutes(
            therapyIntensity.averageSessionDurationMinutes,
          )}
          description={kpi.averageSessionDuration.description}
          tone='violet'
        />
      </div>

      <EffectivenessProgressQualityChart data={progressQuality.trend} />

      <EffectivenessTherapyIntensityChart data={therapyIntensity.trend} />

      {selectedOwner === ALL_OWNERS_VALUE ? (
        <EffectivenessComparisonChart data={comparisonRows} />
      ) : null}

      <p className='text-muted-foreground text-xs leading-relaxed'>
        {EFFECTIVENESS_REPORT_COPY.disclaimer}
      </p>

      <p className='text-muted-foreground text-xs'>
        <Link href='/' className='underline underline-offset-2'>
          Back to dashboard
        </Link>
      </p>
    </div>
  )
}

export default EffectivenessReportPage
