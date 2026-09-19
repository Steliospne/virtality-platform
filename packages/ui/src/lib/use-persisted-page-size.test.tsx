import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { tableDefaults } from './table-defaults.js'
import {
  tablePageSizeStorageKey,
  usePersistedPageSize,
} from './use-persisted-page-size.js'

/** Node's built-in `localStorage` global is an inert stub without `--localstorage-file`. */
function createMemoryStorage(): Storage {
  const items = new Map<string, string>()
  return {
    get length() {
      return items.size
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => {
      items.delete(key)
    },
    setItem: (key, value) => {
      items.set(key, String(value))
    },
  }
}

describe('usePersistedPageSize', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('starts from the default page size when nothing is stored', () => {
    const { result } = renderHook(() => usePersistedPageSize('patients'))

    expect(result.current.pagination).toEqual({
      pageIndex: 0,
      pageSize: tableDefaults.pageSize,
    })
    expect(localStorage.getItem(tablePageSizeStorageKey('patients'))).toBeNull()
  })

  it('applies the stored page size after mount', () => {
    localStorage.setItem(tablePageSizeStorageKey('patients'), '25')

    const { result } = renderHook(() => usePersistedPageSize('patients'))

    expect(result.current.pagination.pageSize).toBe(25)
  })

  it('ignores stored values that are not a page size option', () => {
    localStorage.setItem(tablePageSizeStorageKey('patients'), '7')

    const { result } = renderHook(() => usePersistedPageSize('patients'))

    expect(result.current.pagination.pageSize).toBe(tableDefaults.pageSize)
  })

  it('persists page size changes per table id', () => {
    const { result } = renderHook(() => usePersistedPageSize('patients'))

    act(() => {
      result.current.onPaginationChange((previous) => ({
        ...previous,
        pageSize: 40,
      }))
    })

    expect(result.current.pagination.pageSize).toBe(40)
    expect(localStorage.getItem(tablePageSizeStorageKey('patients'))).toBe('40')
    expect(localStorage.getItem(tablePageSizeStorageKey('sessions'))).toBeNull()
  })

  it('does not persist page index changes', () => {
    const { result } = renderHook(() => usePersistedPageSize('patients'))

    act(() => {
      result.current.onPaginationChange((previous) => ({
        ...previous,
        pageIndex: 2,
      }))
    })

    expect(result.current.pagination.pageIndex).toBe(2)
    expect(localStorage.getItem(tablePageSizeStorageKey('patients'))).toBeNull()
  })
})
