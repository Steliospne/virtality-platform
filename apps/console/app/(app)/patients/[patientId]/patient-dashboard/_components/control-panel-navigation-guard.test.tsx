import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import useNavigationGuard from '@/hooks/use-navigation-guard'
import { NavigationGuardDialog } from '@/components/ui/navigation-guard-dialog'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

afterEach(cleanup)

function Parent({ tick }: { tick: number }) {
  const { guard } = useNavigationGuard(true)

  return (
    <div data-tick={tick}>
      <a href='/patients'>Patients</a>
      <NavigationGuardDialog
        {...guard}
        title='Active connection'
        description='Leaving disconnects the device.'
      />
    </div>
  )
}

describe('NavigationGuardDialog under useNavigationGuard', () => {
  it('keeps the same dialog node when the parent re-renders', async () => {
    const { rerender } = render(<Parent tick={0} />)

    act(() => {
      screen.getByText('Patients').click()
    })
    const dialog = await screen.findByRole('dialog')

    rerender(<Parent tick={1} />)

    expect(screen.getByRole('dialog')).toBe(dialog)
  })

  it('closes on Stay', async () => {
    render(<Parent tick={0} />)
    act(() => {
      screen.getByText('Patients').click()
    })
    await screen.findByRole('dialog')

    act(() => {
      screen.getByText('Stay').click()
    })

    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
