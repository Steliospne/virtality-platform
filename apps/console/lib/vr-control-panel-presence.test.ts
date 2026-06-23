import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const consoleRoot = fileURLToPath(new URL('..', import.meta.url))

function readConsoleFile(relativePath: string): string {
  return readFileSync(join(consoleRoot, relativePath), 'utf8')
}

describe('patient dashboard device dropdown presence', () => {
  it('polls VR presence only while the device dropdown is open', () => {
    const controlPanelSource = readConsoleFile(
      'app/(app)/patients/[patientId]/patient-dashboard/_components/control-panel.tsx',
    )
    const vrControlPanelSource = readConsoleFile(
      'components/ui/vr-control-panel.tsx',
    )

    expect(controlPanelSource).toMatch(/openDevicePop/)
    expect(vrControlPanelSource).toMatch(/useVrPresencePolling/)
    expect(vrControlPanelSource).toMatch(/enabled:\s*isOpen/)
  })

  it('renders loading, online, offline, and unpaired device rows', () => {
    const vrControlPanelSource = readConsoleFile(
      'components/ui/vr-control-panel.tsx',
    )

    expect(vrControlPanelSource).toMatch(/DevicePresenceStatus/)
    expect(vrControlPanelSource).toMatch(/Unpaired/)
    expect(vrControlPanelSource).toMatch(/Online/)
    expect(vrControlPanelSource).toMatch(/Offline/)
    expect(vrControlPanelSource).toMatch(/Loader2/)
  })
})
