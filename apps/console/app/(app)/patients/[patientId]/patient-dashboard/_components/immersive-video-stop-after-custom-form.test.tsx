import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ImmersiveVideoStopAfterCustomForm } from './immersive-video-stop-after-custom-form'

afterEach(cleanup)

function setup(
  props: { stopAfterMin?: number | null; elapsedSec?: number | null } = {},
) {
  const onApply = vi.fn()
  render(
    <ImmersiveVideoStopAfterCustomForm
      stopAfterMin={props.stopAfterMin ?? null}
      elapsedSec={props.elapsedSec ?? null}
      onApply={onApply}
    />,
  )
  const input = screen.getByLabelText('Custom (minutes)') as HTMLInputElement
  const submit = screen.getByRole('button', { name: 'Set' })
  return { onApply, input, submit }
}

describe('ImmersiveVideoStopAfterCustomForm', () => {
  it('applies typed minutes', () => {
    const { onApply, input, submit } = setup()
    fireEvent.change(input, { target: { value: '25' } })
    fireEvent.click(submit)
    expect(onApply).toHaveBeenCalledWith(25)
  })

  it('prefills the current limit', () => {
    const { input } = setup({ stopAfterMin: 25 })
    expect(input.value).toBe('25')
  })

  it('shows an error instead of applying a limit the session already reached', () => {
    const { onApply, input, submit } = setup({ elapsedSec: 600 })
    fireEvent.change(input, { target: { value: '10' } })
    fireEvent.click(submit)
    expect(onApply).not.toHaveBeenCalled()
    expect(
      screen.getByText('The session has already run that long.'),
    ).toBeTruthy()
    expect(input.getAttribute('aria-invalid')).toBe('true')
  })

  it('clears the error once the physio edits the value', () => {
    const { input, submit } = setup()
    fireEvent.click(submit)
    expect(screen.getByText('Enter whole minutes.')).toBeTruthy()
    fireEvent.change(input, { target: { value: '3' } })
    expect(screen.queryByText('Enter whole minutes.')).toBeNull()
  })
})
