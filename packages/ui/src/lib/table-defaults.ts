import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from '@tanstack/react-table'

export const tablePageSizeOptions = [10, 20, 25, 30, 40, 50] as const

export const tableDefaults = {
  pageSize: tablePageSizeOptions[0],
  models: {
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    /**
     * Table-core's default page-index auto-reset runs as a microtask queued
     * from inside `getRowModel()`, so it can fire a state update on the
     * table's owning component before that component has mounted (surfaces
     * as "Can't perform a React state update on a component that hasn't
     * mounted yet"). Disable it here; callers that need the page index reset
     * when filters/data change should do so explicitly in a `useEffect`.
     */
    autoResetPageIndex: false,
  },
}
