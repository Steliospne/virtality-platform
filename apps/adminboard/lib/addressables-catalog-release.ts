/** Mirrors `AddressablesCatalogRelease` from `@virtality/orpc`. */
export type AddressablesCatalogRelease = {
  stem: string
  catalogKey: string
  catalogSizeBytes: number
  hashKey: string | null
  lastModified: string | null
  live: boolean
}

export function addressablesCatalogObjectName(key: string): string {
  return key.slice(key.lastIndexOf('/') + 1)
}
