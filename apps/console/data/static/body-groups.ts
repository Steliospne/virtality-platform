import shoulderImage from '@/public/assets/body-groups/SHOULDER_ICON.svg'
import wristImage from '@/public/assets/body-groups/WRIST_ICON.svg'
import forearmImage from '@/public/assets/body-groups/FOREARM_ICON.svg'
import { StaticImageData } from 'next/image'
export const bodyGroups = {
  shoulder: {
    image: shoulderImage as StaticImageData,
  },
  wrist: {
    image: wristImage as StaticImageData,
  },
  forearm: {
    image: forearmImage as StaticImageData,
  },
} as const

export type BodyGroupKey = keyof typeof bodyGroups
