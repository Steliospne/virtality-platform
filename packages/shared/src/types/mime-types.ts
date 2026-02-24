export const IMAGE_TYPE = {
  'image/jpeg': '.jpeg',
  'image/png': '.png',
  'image/webp': '.webp',
} as const

export type ImageType = keyof typeof IMAGE_TYPE
