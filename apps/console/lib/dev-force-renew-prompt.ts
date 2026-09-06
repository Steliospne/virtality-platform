'use client'

import { useSyncExternalStore } from 'react'

/**
 * Dev-only override so AdminTool can force RenewPromptBanner to render for
 * visual QA, regardless of entitlement standing or dismiss state. Never
 * persisted across sessions; lives only in memory for the current tab.
 */

const listeners = new Set<() => void>()
let forced = false

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return forced
}

function getServerSnapshot() {
  return false
}

export function setForceRenewPrompt(value: boolean): void {
  if (forced === value) return
  forced = value
  listeners.forEach((listener) => listener())
}

export function useForceRenewPrompt(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
