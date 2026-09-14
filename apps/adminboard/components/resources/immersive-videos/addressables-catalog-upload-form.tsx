'use client'

import { Button } from '@/components/ui/button'
import { getErrorMessage } from '@/lib/get-error-message'
import { useUploadAddressablesCatalog } from '@virtality/react-query'
import { Input } from '@virtality/ui/components/input'
import { Label } from '@virtality/ui/components/label'
import { useState } from 'react'
import { toast } from 'sonner'

/**
 * Takes the `catalog_<ts>.bin` (or `.json`) and `catalog_<ts>.hash` pair from
 * the headset project's Addressables build. Uploading the `.hash` is what
 * flips headsets onto the new catalog, so every bundle it names must already
 * be published.
 */
export function AddressablesCatalogUploadForm() {
  const upload = useUploadAddressablesCatalog()
  const [catalog, setCatalog] = useState<File | null>(null)
  const [hash, setHash] = useState<File | null>(null)
  const [resetKey, setResetKey] = useState(0)

  const submit = async () => {
    if (!catalog || !hash) return
    try {
      const release = await upload.mutateAsync({ catalog, hash })
      toast.success(`Catalog ${release.stem} is live on the CDN.`)
      setCatalog(null)
      setHash(null)
      setResetKey((key) => key + 1)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to upload catalog'))
    }
  }

  return (
    <div key={resetKey} className='space-y-3'>
      <div className='space-y-2'>
        <Label htmlFor='addressables-catalog-file'>
          Catalog (.bin / .json)
        </Label>
        <Input
          id='addressables-catalog-file'
          type='file'
          accept='.bin,.json'
          onChange={(event) => setCatalog(event.target.files?.[0] ?? null)}
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='addressables-catalog-hash'>Hash (.hash)</Label>
        <Input
          id='addressables-catalog-hash'
          type='file'
          accept='.hash'
          onChange={(event) => setHash(event.target.files?.[0] ?? null)}
        />
      </div>
      <Button
        type='button'
        variant='primary'
        disabled={!catalog || !hash || upload.isPending}
        onClick={() => void submit()}
      >
        {upload.isPending ? 'Uploading…' : 'Upload catalog'}
      </Button>
    </div>
  )
}
