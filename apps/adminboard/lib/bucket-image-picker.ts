import type { BucketFolderRow, BucketObjectRow } from '@virtality/shared/utils'

function normalizeBucketImagePickerQuery(query: string): string {
  return query.trim().toLowerCase()
}

function matchesBucketImagePickerQuery(
  values: string[],
  normalizedQuery: string,
): boolean {
  return values.some((value) => value.toLowerCase().includes(normalizedQuery))
}

export function filterBucketImagePickerFolders(
  folders: BucketFolderRow[],
  query: string,
): BucketFolderRow[] {
  const normalizedQuery = normalizeBucketImagePickerQuery(query)
  if (!normalizedQuery) {
    return folders
  }

  return folders.filter((folder) =>
    matchesBucketImagePickerQuery(
      [folder.name, folder.prefix],
      normalizedQuery,
    ),
  )
}

export function filterBucketImagePickerObjects(
  objects: BucketObjectRow[],
  query: string,
): BucketObjectRow[] {
  const normalizedQuery = normalizeBucketImagePickerQuery(query)
  const imageObjects = objects.filter((object) =>
    object.contentType.startsWith('image/'),
  )

  if (!normalizedQuery) {
    return imageObjects
  }

  return imageObjects.filter((object) =>
    matchesBucketImagePickerQuery(
      [object.name, object.objectKey],
      normalizedQuery,
    ),
  )
}
