import { describe, expect, it, vi } from 'vitest'
import { scheduleAfterDropdownClose } from './schedule-after-dropdown-close'

describe('scheduleAfterDropdownClose', () => {
  it('closes the dropdown before scheduling the follow-up action', () => {
    const order: string[] = []
    const schedule = vi.fn((callback: () => void) => callback())

    scheduleAfterDropdownClose(
      () => order.push('close'),
      () => order.push('action'),
      schedule,
    )

    expect(order).toEqual(['close', 'action'])
    expect(schedule).toHaveBeenCalledOnce()
  })
})
