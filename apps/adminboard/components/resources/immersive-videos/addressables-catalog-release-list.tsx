'use client'

import {
  addressablesCatalogObjectName,
  type AddressablesCatalogRelease,
} from '@/lib/addressables-catalog-release'
import { formatImmersiveVideoSize } from '@/lib/immersive-video-admin-row'
import { Badge } from '@virtality/ui/components/badge'

export function AddressablesCatalogReleaseList({
  releases,
}: {
  releases: AddressablesCatalogRelease[]
}) {
  if (releases.length === 0) {
    return (
      <p className='text-muted-foreground text-sm'>
        No catalog on the CDN yet. Headsets cannot resolve any bundle until one
        is uploaded.
      </p>
    )
  }

  return (
    <ul className='space-y-1 text-sm'>
      {releases.map((release) => (
        <li
          key={release.stem}
          className='flex flex-wrap items-center gap-2 font-mono'
        >
          <span>{addressablesCatalogObjectName(release.catalogKey)}</span>
          <span className='text-muted-foreground'>
            {formatImmersiveVideoSize(release.catalogSizeBytes)}
          </span>
          {release.live ? (
            <Badge>Live</Badge>
          ) : release.hashKey == null ? (
            <Badge variant='outline'>No .hash</Badge>
          ) : null}
          {release.lastModified ? (
            <span className='text-muted-foreground font-sans'>
              {new Date(release.lastModified).toLocaleString()}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
