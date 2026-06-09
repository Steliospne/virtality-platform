import { createORPCClient, type ORPCClient } from '@virtality/orpc/client'
import { getServerUrl, ORPC_PREFIX } from '@virtality/shared/types'

let clientInstance: ORPCClient | null = null

const serverBaseUrl = getServerUrl()

const orpcUrl = `${serverBaseUrl}${ORPC_PREFIX}`

export function getConsoleORPCClient(): ORPCClient {
  if (!clientInstance) {
    clientInstance = createORPCClient({
      url: orpcUrl,
      fetch: (request, init) =>
        fetch(request, { ...init, credentials: 'include' }),
    })
  }

  return clientInstance
}
