import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
    if (!word) throw new Error('Invalid word')
    const chars = Array.from(word)

    // Create a span for the word
    const wordSpan = document.createElement('span')
    wordSpan.className = `${wordClass} ${wordClass}-${wordIndex + 1}`
    wordSpan.style.display = 'inline-block'

    // Create spans for each character in the word
    for (let charIndex = 0; charIndex < chars.length; charIndex++) {
      const char = chars[charIndex]
      if (!char) throw new Error('Invalid character')
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
