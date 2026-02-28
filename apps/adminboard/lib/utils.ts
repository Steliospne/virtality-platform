import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import crypto from 'crypto'
import { v4 as uuid } from 'uuid'
import { Exercise } from '@virtality/db'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const isEmpty = (obj: object) => {
  return Object.keys(obj).length === 0
}

export const randomImageName = (bytes = 8) =>
  crypto.randomBytes(bytes).toString('hex')

export const getUUID = () => {
  return uuid()
}

export const getDisplayName = (
  e?: Exercise | Pick<Exercise, 'displayName' | 'direction'>,
) => (!e ? undefined : e.displayName + ' ' + e.direction)
