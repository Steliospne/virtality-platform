import { IMAGE_TYPE, ImageType } from '../types/mime-types.ts'
import { Buffer } from 'node:buffer'
import { createRandomStringGenerator } from './random.ts'

export const generateImageFile = async ({
  image,
  resource,
}: {
  image: File
  resource: string
}) => {
  if (!image) return null
  const generator = createRandomStringGenerator('a-z', 'A-Z', '0-9')

  const ContentType = image.type as ImageType
  const Key = `${generator(12)}_${resource}${IMAGE_TYPE[ContentType]}`
  const buffer = Buffer.from(await image.arrayBuffer())

  return {
    ContentType,
    Key,
    buffer,
  }
}
