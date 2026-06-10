import type { EmailBodyBlock } from '@virtality/shared/types'
import { v4 as uuidv4 } from 'uuid'

export const createEmailBodyBlock = (
  type: EmailBodyBlock['type'],
): EmailBodyBlock => {
  const id = uuidv4()

  switch (type) {
    case 'heading':
      return { type: 'heading', id, text: '', level: 2 }
    case 'paragraph':
      return { type: 'paragraph', id, text: '' }
    case 'image':
      return { type: 'image', id, objectKey: '', alt: '' }
    case 'button':
      return { type: 'button', id, label: '', href: 'https://' }
    case 'list':
      return { type: 'list', id, items: [''], ordered: false }
    case 'card':
      return { type: 'card', id }
    case 'divider':
      return { type: 'divider', id }
  }
}

export const BLOCK_TYPE_LABELS: Record<EmailBodyBlock['type'], string> = {
  heading: 'Heading',
  paragraph: 'Paragraph',
  image: 'Image',
  button: 'Button',
  list: 'List',
  card: 'Card',
  divider: 'Divider',
}
