import type { BucketFolderRow, BucketObjectRow } from '@virtality/shared/utils'

export function filterBucketImagePickerFolders(
  folders: BucketFolderRow[],
  query: string,
): BucketFolderRow[] {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) {
    return folders
  }

  return folders.filter(
    (folder) =>
      folder.name.toLowerCase().includes(normalizedQuery) ||
      folder.prefix.toLowerCase().includes(normalizedQuery),
  )
}

export function filterBucketImagePickerObjects(
  objects: BucketObjectRow[],
  query: string,
): BucketObjectRow[] {
  const normalizedQuery = query.trim().toLowerCase()

  return objects
    .filter((object) => object.contentType.startsWith('image/'))
    .filter((object) =>
      normalizedQuery
        ? object.name.toLowerCase().includes(normalizedQuery) ||
          object.objectKey.toLowerCase().includes(normalizedQuery)
        : true,
    )
}
