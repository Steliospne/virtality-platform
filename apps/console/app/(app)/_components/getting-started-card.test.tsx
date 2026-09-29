import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import GettingStartedCard from './getting-started-card'
import { buildGettingStarted } from '@/lib/home-getting-started'

const fresh = buildGettingStarted({
  deviceCount: 0,
  pairedDeviceCount: 0,
  patientCount: 1,
  programCount: 0,
  sessionCount: 0,
})

const done = buildGettingStarted({
  deviceCount: 1,
  pairedDeviceCount: 1,
  patientCount: 2,
  programCount: 1,
  sessionCount: 3,
})

afterEach(cleanup)

describe('GettingStartedCard', () => {
  it('opens on the steps while any remain', () => {
    render(<GettingStartedCard gettingStarted={fresh} />)

    expect(screen.getByText('Pair a headset')).toBeTruthy()
    expect(screen.getByLabelText('1 of 4 steps done')).toBeTruthy()
    expect(screen.getByRole('button', { name: /hide steps/i })).toBeTruthy()
  })

  it('stays on the dashboard when every step is done, collapsed to its summary', () => {
    render(<GettingStartedCard gettingStarted={done} />)

    expect(screen.getByText('You are all set.')).toBeTruthy()
    expect(screen.getByLabelText('4 of 4 steps done')).toBeTruthy()
    expect(screen.queryByText('Pair a headset')).toBeNull()
  })

  it('expands a completed card again on request', () => {
    render(<GettingStartedCard gettingStarted={done} />)

    fireEvent.click(screen.getByRole('button', { name: /show steps/i }))

    expect(screen.getByText('Pair a headset')).toBeTruthy()
    expect(screen.getByText('Run a Started Session')).toBeTruthy()
  })
})
