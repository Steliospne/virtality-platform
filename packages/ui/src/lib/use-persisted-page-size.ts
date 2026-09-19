'use client'

import type { OnChangeFn, PaginationState } from '@tanstack/react-table'
import {
  tableDefaults,
  tablePageSizeOptions,
} from '@virtality/ui/lib/table-defaults'
import { useEffect, useRef, useState } from 'react'

const STORAGE_PREFIX = 'virtality:table-page-size:' as const

export function tablePageSizeStorageKey(tableId: string): string {
  return `${STORAGE_PREFIX}${tableId}`
}

function isPageSizeOption(value: number): boolean {
  return (tablePageSizeOptions as readonly number[]).includes(value)
}

export function readPersistedPageSize(
  tableId: string,
  storage: Pick<Storage, 'getItem'> | undefined = globalThis.localStorage,
): number | undefined {
  try {
    const raw = storage?.getItem(tablePageSizeStorageKey(tableId))
    if (raw === null || raw === undefined) return undefined
    const pageSize = Number(raw)
    return isPageSizeOption(pageSize) ? pageSize : undefined
  } catch {
    return undefined
  }
}

export function writePersistedPageSize(
  tableId: string,
  pageSize: number,
  storage: Pick<Storage, 'setItem'> | undefined = globalThis.localStorage,
): void {
  try {
    storage?.setItem(tablePageSizeStorageKey(tableId), String(pageSize))
  } catch {
    // Private mode / quota: the choice only lasts for this mount.
  }
}

/**
 * Pagination state whose page size is remembered per table in localStorage.
 * The first render uses the default so server and client markup match; the
 * stored value is applied after mount.
 */
export function usePersistedPageSize(tableId: string) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: tableDefaults.pageSize,
  })
  const hydratedRef = useRef(false)

  useEffect(() => {
    const stored = readPersistedPageSize(tableId)
    hydratedRef.current = true
    if (stored === undefined) return
    setPagination((previous) =>
      previous.pageSize === stored
        ? previous
        : { ...previous, pageSize: stored },
    )
  }, [tableId])

  const onPaginationChange: OnChangeFn<PaginationState> = (updater) => {
    const next = typeof updater === 'function' ? updater(pagination) : updater
    if (hydratedRef.current && next.pageSize !== pagination.pageSize) {
      writePersistedPageSize(tableId, next.pageSize)
    }
    setPagination(next)
  }

  return { pagination, onPaginationChange }
}
