import { bucketCdnUrl } from './bucket.ts'

export type BucketReferenceResourceType =
  | 'exercise'
  | 'avatar'
  | 'map'
  | 'patient'
  | 'user'

export type BucketReferenceField = 'image' | 'video'

export type BucketObjectReference = {
  resourceType: BucketReferenceResourceType
  resourceId: string
  resourceLabel: string
  field: BucketReferenceField
}

export type BucketObjectReferencesOutcome = {
  objectKey: string
  cdnUrl: string
  references: BucketObjectReference[]
}

export type BucketReferenceReader = {
  findExerciseReferences: (
    lookupValues: string[],
  ) => Promise<
    Array<{
      id: string
      displayName: string
      image: string | null
      video: string | null
    }>
  >
  findAvatarReferences: (
    lookupValues: string[],
  ) => Promise<
    Array<{
      id: string
      name: string
      image: string | null
    }>
  >
  findMapReferences: (
    lookupValues: string[],
  ) => Promise<
    Array<{
      id: string
      name: string
      image: string | null
    }>
  >
  findPatientReferences: (
    lookupValues: string[],
  ) => Promise<
    Array<{
      id: string
      name: string
      image: string | null
    }>
  >
  findUserReferences: (
    lookupValues: string[],
  ) => Promise<
    Array<{
      id: string
      name: string
      image: string | null
    }>
  >
}

const RESOURCE_TYPE_ORDER: BucketReferenceResourceType[] = [
  'exercise',
  'avatar',
  'map',
  'patient',
  'user',
]

export function buildBucketReferenceLookupValues(objectKey: string): string[] {
  const trimmedKey = objectKey.trim()
  return [trimmedKey, bucketCdnUrl(trimmedKey)]
}

function fieldMatchesReference(
  storedValue: string | null | undefined,
  lookupValues: string[],
): boolean {
  if (!storedValue) {
    return false
  }

  return lookupValues.includes(storedValue)
}

function sortReferences(
  references: BucketObjectReference[],
): BucketObjectReference[] {
  return [...references].sort((left, right) => {
    const typeOrder =
      RESOURCE_TYPE_ORDER.indexOf(left.resourceType) -
      RESOURCE_TYPE_ORDER.indexOf(right.resourceType)

    if (typeOrder !== 0) {
      return typeOrder
    }

    return left.resourceLabel.localeCompare(right.resourceLabel)
  })
}

export async function findKnownBucketObjectReferences({
  reader,
  objectKey,
}: {
  reader: BucketReferenceReader
  objectKey: string
}): Promise<BucketObjectReferencesOutcome> {
  const trimmedKey = objectKey.trim()
  const lookupValues = buildBucketReferenceLookupValues(trimmedKey)
  const references: BucketObjectReference[] = []

  const [exercises, avatars, maps, patients, users] = await Promise.all([
    reader.findExerciseReferences(lookupValues),
    reader.findAvatarReferences(lookupValues),
    reader.findMapReferences(lookupValues),
    reader.findPatientReferences(lookupValues),
    reader.findUserReferences(lookupValues),
  ])

  for (const exercise of exercises) {
    if (fieldMatchesReference(exercise.image, lookupValues)) {
      references.push({
        resourceType: 'exercise',
        resourceId: exercise.id,
        resourceLabel: exercise.displayName,
        field: 'image',
      })
    }

    if (fieldMatchesReference(exercise.video, lookupValues)) {
      references.push({
        resourceType: 'exercise',
        resourceId: exercise.id,
        resourceLabel: exercise.displayName,
        field: 'video',
      })
    }
  }

  for (const avatar of avatars) {
    if (fieldMatchesReference(avatar.image, lookupValues)) {
      references.push({
        resourceType: 'avatar',
        resourceId: avatar.id,
        resourceLabel: avatar.name,
        field: 'image',
      })
    }
  }

  for (const map of maps) {
    if (fieldMatchesReference(map.image, lookupValues)) {
      references.push({
        resourceType: 'map',
        resourceId: map.id,
        resourceLabel: map.name,
        field: 'image',
      })
    }
  }

  for (const patient of patients) {
    if (fieldMatchesReference(patient.image, lookupValues)) {
      references.push({
        resourceType: 'patient',
        resourceId: patient.id,
        resourceLabel: patient.name,
        field: 'image',
      })
    }
  }

  for (const user of users) {
    if (fieldMatchesReference(user.image, lookupValues)) {
      references.push({
        resourceType: 'user',
        resourceId: user.id,
        resourceLabel: user.name,
        field: 'image',
      })
    }
  }

  return {
    objectKey: trimmedKey,
    cdnUrl: bucketCdnUrl(trimmedKey),
    references: sortReferences(references),
  }
}
