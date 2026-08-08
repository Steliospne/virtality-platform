export type { RouterClient } from '@orpc/server'
export type { InitialContext } from './context.ts'
export { orpcHandler } from './orpc-handler.ts'
export type { Router } from './router.ts'
export {
  claimDevicePairing,
  DevicePairingError,
} from './procedures/device-pairing/device-pairing.ts'
