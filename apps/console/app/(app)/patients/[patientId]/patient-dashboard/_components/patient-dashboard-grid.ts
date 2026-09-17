import { cn } from '@/lib/utils'

type DashboardGridFlags = {
  showExpiredBanner: boolean
  showCasting: boolean
  /** Immersive Video mode: no exercise list and no session notes. */
  hideExerciseList?: boolean
}

type CompactLayout = 'expiredCasting' | 'expired' | 'casting' | 'base'

function compactLayout({
  showExpiredBanner,
  showCasting,
}: DashboardGridFlags): CompactLayout {
  if (showExpiredBanner && showCasting) return 'expiredCasting'
  if (showExpiredBanner) return 'expired'
  if (showCasting) return 'casting'
  return 'base'
}

const EXERCISE_LIST_COMPACT: Record<CompactLayout, string> = {
  expiredCasting:
    'max-[1526px]:row-start-31 max-[1526px]:row-end-44 lg:max-[1526px]:row-start-37 lg:max-[1526px]:row-end-51',
  expired:
    'max-[1526px]:row-start-28 max-[1526px]:row-end-41 lg:max-[1526px]:row-start-34 lg:max-[1526px]:row-end-48',
  casting:
    'max-[1526px]:row-start-28 max-[1526px]:row-end-41 lg:max-[1526px]:row-start-34 lg:max-[1526px]:row-end-48',
  base: 'max-[1526px]:row-start-25 max-[1526px]:row-end-38 lg:max-[1526px]:row-start-31 lg:max-[1526px]:row-end-45',
}

const SESSION_NOTES_COMPACT: Record<CompactLayout, string> = {
  expiredCasting:
    'max-[1526px]:row-start-45 max-[1526px]:row-end-61 lg:max-[1526px]:row-start-52 lg:max-[1526px]:row-end-68',
  expired:
    'max-[1526px]:row-start-42 max-[1526px]:row-end-58 lg:max-[1526px]:row-start-49 lg:max-[1526px]:row-end-68',
  casting:
    'max-[1526px]:row-start-42 max-[1526px]:row-end-58 lg:max-[1526px]:row-start-49 lg:max-[1526px]:row-end-65',
  base: 'max-[1526px]:row-start-39 max-[1526px]:row-end-55 lg:max-[1526px]:row-start-46 lg:max-[1526px]:row-end-65',
}

const GRID_ROWS: Record<CompactLayout, string> = {
  expiredCasting: 'grid-rows-[repeat(53,24px)]',
  expired: 'grid-rows-[repeat(58,24px)]',
  casting: 'grid-rows-[repeat(50,24px)]',
  base: 'grid-rows-[repeat(55,24px)]',
}

// Info panel plus the immersive stack (video card, then casting under it
// when it is open); nothing below them.
const GRID_ROWS_WITHOUT_LIST: Record<CompactLayout, string> = {
  expiredCasting: 'grid-rows-[repeat(48,24px)]',
  expired: 'grid-rows-[repeat(36,24px)]',
  casting: 'grid-rows-[repeat(45,24px)]',
  base: 'grid-rows-[repeat(33,24px)]',
}

const GRID_ROWS_WITHOUT_LIST_COMPACT: Record<CompactLayout, string> = {
  expiredCasting: 'lg:max-[1526px]:grid-rows-[repeat(47,24px)]',
  expired: 'lg:max-[1526px]:grid-rows-[repeat(32,24px)]',
  casting: 'lg:max-[1526px]:grid-rows-[repeat(44,24px)]',
  base: 'lg:max-[1526px]:grid-rows-[repeat(29,24px)]',
}

// Immersive Video mode: the video card sits where the chart would, and the
// casting panel stacks under it instead of replacing it.
const IMMERSIVE_STACK_SPAN: Record<CompactLayout, string> = {
  expiredCasting:
    'row-span-41 max-[1526px]:row-end-42 lg:max-[1526px]:row-end-48',
  expired: 'row-span-29 max-[1526px]:row-end-30 lg:max-[1526px]:row-end-36',
  casting: 'row-span-41 max-[1526px]:row-end-39 lg:max-[1526px]:row-end-45',
  base: 'row-span-29 max-[1526px]:row-end-27 lg:max-[1526px]:row-end-33',
}

function mainColumnStart(hideExerciseList: boolean | undefined): string {
  return hideExerciseList ? 'col-start-1' : 'col-start-4'
}

export function dashboardGridClassName(flags: DashboardGridFlags): string {
  const layout = compactLayout(flags)
  if (flags.hideExerciseList) {
    return cn(
      'container grid grid-cols-12 gap-x-4 p-8',
      GRID_ROWS_WITHOUT_LIST_COMPACT[layout],
      GRID_ROWS_WITHOUT_LIST[layout],
    )
  }
  return cn(
    'container grid grid-cols-12 gap-x-4 p-8',
    flags.showExpiredBanner
      ? 'lg:max-[1526px]:grid-rows-[repeat(68,24px)]'
      : 'lg:max-[1526px]:grid-rows-[repeat(65,24px)]',
    GRID_ROWS[layout],
  )
}

export function dashboardInfoPanelClassName(
  showExpiredBanner: boolean,
  hideExerciseList = false,
): string {
  return cn(
    '-col-end-1 row-start-1 flex flex-col gap-3 max-[1526px]:col-start-1',
    mainColumnStart(hideExerciseList),
    showExpiredBanner ? 'row-end-7' : 'row-end-4',
  )
}

export function dashboardExerciseListClassName(
  flags: DashboardGridFlags,
): string {
  return cn(
    'col-span-3 col-start-1 row-span-20 row-start-1 max-[1526px]:col-span-full max-[1526px]:col-start-1',
    EXERCISE_LIST_COMPACT[compactLayout(flags)],
  )
}

export function dashboardChartClassName(showExpiredBanner: boolean): string {
  return cn(
    'relative col-span-full col-start-4 row-span-29 max-[1526px]:col-start-1',
    showExpiredBanner ? 'row-start-8' : 'row-start-5',
    showExpiredBanner
      ? 'max-[1526px]:row-end-27 lg:max-[1526px]:row-end-33'
      : 'max-[1526px]:row-end-24 lg:max-[1526px]:row-end-30',
  )
}

export function dashboardCastingClassName(showExpiredBanner: boolean): string {
  return cn(
    'relative col-span-full col-start-4 row-span-29 max-[1526px]:col-start-1',
    showExpiredBanner ? 'row-start-8' : 'row-start-5',
    showExpiredBanner
      ? 'max-[1526px]:row-end-30 lg:max-[1526px]:row-end-36'
      : 'max-[1526px]:row-end-27 lg:max-[1526px]:row-end-33',
  )
}

export function dashboardImmersiveStackClassName(
  flags: DashboardGridFlags,
): string {
  return cn(
    'relative col-span-full col-start-1',
    flags.showExpiredBanner ? 'row-start-8' : 'row-start-5',
    IMMERSIVE_STACK_SPAN[compactLayout(flags)],
  )
}

export function dashboardSessionNotesClassName(
  flags: DashboardGridFlags,
): string {
  const layout = compactLayout(flags)
  return cn(
    'col-span-full col-start-4 row-span-16 max-[1526px]:col-start-1',
    flags.showExpiredBanner ? 'row-start-38' : 'row-start-35',
    SESSION_NOTES_COMPACT[layout],
  )
}
