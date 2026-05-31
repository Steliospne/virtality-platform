import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind class names for shared UI components. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
