import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import crypto from 'crypto'
import { Exercise } from '@virtality/db'
import { keyExists, setKey } from '@/redis'
import { v4 as uuid } from 'uuid'
import { deleteFile, uploadFile } from '@/S3'
import { IMAGE_TYPE, ImageType } from '@/types/models'
import { ParsePayload } from 'zod/v4/core'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const generateCode = () =>
  Math.floor(Math.random() * 1000_000)
    .toString()
    .padStart(6, '0')

export const progressiveRetry = async (maxRetries = 3, baseDelay = 250) => {
  let attempt = 0

  while (attempt < maxRetries) {
    try {
      const code = generateCode()
      await keyExists(code)
      await setKey(code, crypto.randomBytes(16).toString('hex'))
      return code
    } catch (error) {
      attempt++

      const errorMessage =
        error instanceof Error ? error.message : String(error)
      console.log(`Attempt ${attempt} failed:`, errorMessage)

      if (attempt >= maxRetries) {
        throw new Error(`Failed after ${maxRetries} attempts`)
      }

      // Progressive backoff: wait longer each time
      const delay = baseDelay * Math.pow(2, attempt - 1)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
}

/**
 * Splits text content of an element into individual word and character elements for animation
 * @param element The HTML element containing text to split
 * @param options Configuration options for the split
 * @returns An object with arrays of the created elements
 */
export function splitText(
  element: HTMLElement,
  options: {
    splitBy?: string
    charClass?: string
    wordClass?: string
    preserveWhitespace?: boolean
  } = {},
) {
  if (!element) {
    console.error('No element provided to splitText')
    return { words: [], chars: [] }
  }

  const {
    splitBy = ' ',
    charClass = 'split-char',
    wordClass = 'split-word',
    preserveWhitespace = true,
  } = options

  // Store the original text content
  const originalText = element.textContent || ''

  // Split the text into words
  const words = originalText.split(splitBy).filter((word) => word.length > 0)

  // Clear the element's content to replace with our split version
  element.innerHTML = ''

  // Create elements for each word and character
  const wordElements: HTMLElement[] = []
  const charElements: HTMLElement[] = []

  // The delimiter to use between words
  const delimiter = preserveWhitespace ? (splitBy === ' ' ? ' ' : splitBy) : ''

  for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
    const word = words[wordIndex]
    const chars = Array.from(word)

    // Create a span for the word
    const wordSpan = document.createElement('span')
    wordSpan.className = `${wordClass} ${wordClass}-${wordIndex + 1}`
    wordSpan.style.display = 'inline-block'

    // Create spans for each character in the word
    for (let charIndex = 0; charIndex < chars.length; charIndex++) {
      const char = chars[charIndex]

      // Create a span for the character
      const charSpan = document.createElement('span')
      charSpan.className = `${charClass} ${charClass}-${charIndex + 1}`
      charSpan.style.display = 'inline-block'
      charSpan.textContent = char

      // Add the character span to the word span
      wordSpan.appendChild(charSpan)

      // Store the character element for animation
      charElements.push(charSpan)
    }

    // Add the word to the element
    element.appendChild(wordSpan)

    // Add a delimiter after each word (except the last one)
    if (wordIndex < words.length - 1 && delimiter) {
      element.appendChild(document.createTextNode(delimiter))
    }

    // Store the word element for animation
    wordElements.push(wordSpan)
  }

  return {
    words: wordElements,
    chars: charElements,
  }
}

export const randomImageName = (bytes = 8) =>
  crypto.randomBytes(bytes).toString('hex')

export const getModelImage = (modelId: string) => {
  const modelMap: Record<string, string> = {
    'Meta Quest 3': '/meta_quest_3.avif',
    'Meta Quest 3S': '/meta_quest_3s.avif',
    'Meta Quest Pro': '/meta_quest_pro.jpg',
    'Meta Quest 2': '/meta_quest_2.avif',
  }
  return modelMap[modelId] || modelId
}

export const getDisplayName = (
  e?: Exercise | Pick<Exercise, 'displayName' | 'direction'>,
) => (!e ? undefined : e.displayName + ' ' + e.direction)

export const getUUID = () => {
  return uuid()
}

export const createImage = async (
  image: File,
  resource: string,
  prevImage?: string | null,
) => {
  const baseURL = process.env.NEXT_PUBLIC_CDN_URL

  if (!baseURL) throw Error('CDN URL is missing.')

  if (!image) return null

  const ContentType = image.type as ImageType
  const Key = `${randomImageName()}_${resource}${IMAGE_TYPE[ContentType]}`
  const generatedURL = `${baseURL}/${Key}`
  const buffer = Buffer.from(await image.arrayBuffer())

  try {
    await uploadFile({
      Body: buffer,
      ContentType,
      Key,
    })
    if (prevImage) {
      const Key = prevImage.split('/')[3]
      deleteFile({ Key })
    }
    return generatedURL
  } catch (error) {
    console.log('Error uploading to S3: ', error)
    return null
  }
}

export const isValidNumber = (value: string | null | undefined) => {
  const isUndefined = value === undefined
  const isValueNaN = isNaN(Number(value))
  const isEmptyString = value === ''
  const isPositive = Number(value) >= 0

  return isEmptyString || (!isUndefined && !isValueNaN && isPositive)
}

export const isValidPassword = (ctx: ParsePayload<string>) => {
  if (ctx.value.length < 8 || ctx.value.length > 16) {
    ctx.issues.push({
      message: '• Password must be between 8 and 16 characters long.',
      input: ctx.value,
      code: 'length' as 'custom',
    })
  }

  if (!/(?=.*[A-Z]).+/.test(ctx.value)) {
    ctx.issues.push({
      message: '• Password must contain at least one uppercase letter.',
      input: ctx.value,
      code: 'uppercase' as 'custom',
    })
  }

  if (!/(?=.*[a-z]).+/.test(ctx.value)) {
    ctx.issues.push({
      message: '• Password must contain at least one lowercase letter.',
      input: ctx.value,
      code: 'lowercase' as 'custom',
    })
  }

  if (!/(?=.*\d).+/.test(ctx.value)) {
    ctx.issues.push({
      message: '• Password must contain at least one digit.',
      input: ctx.value,
      code: 'digit' as 'custom',
    })
  }
}
