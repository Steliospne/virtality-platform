'use client'

import { AddressablesCatalogReleaseList } from '@/components/resources/immersive-videos/addressables-catalog-release-list'
import { AddressablesCatalogUploadForm } from '@/components/resources/immersive-videos/addressables-catalog-upload-form'
import { useAddressablesCatalogReleases } from '@virtality/react-query'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@virtality/ui/components/card'

const REMOTE_LOAD_PATH = 'https://cdn.virtality.app/immersive-videos'

export function AddressablesCatalogCard() {
  const releases = useAddressablesCatalogReleases()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Addressables catalog</CardTitle>
        <CardDescription>
          Headsets resolve bundles through the catalog at{' '}
          <code className='font-mono'>{REMOTE_LOAD_PATH}</code>. Publish every
          bundle the catalog names first, then upload the catalog pair; the
          .hash goes live immediately.
        </CardDescription>
      </CardHeader>
      <CardContent className='grid gap-6 md:grid-cols-2'>
        <AddressablesCatalogUploadForm />
        {releases.isPending ? (
          <p className='text-muted-foreground text-sm'>Loading…</p>
        ) : releases.isError ? (
          <p className='text-destructive text-sm'>
            Could not list catalogs on the CDN.
          </p>
        ) : (
          <AddressablesCatalogReleaseList releases={releases.data} />
        )}
      </CardContent>
    </Card>
  )
}
