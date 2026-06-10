import { describe, expect, it } from 'vitest'
import { renderAdminAuthoredEmail } from './render-admin-authored-email.js'

describe('renderAdminAuthoredEmail', () => {
  it('renders the brand shell and supported body blocks', async () => {
    const rendered = await renderAdminAuthoredEmail({
      subject: 'June product update',
      previewText: 'What shipped this month',
      bodyBlocks: [
        {
          type: 'heading',
          id: 'heading-1',
          text: 'June product update',
          level: 1,
        },
        {
          type: 'paragraph',
          id: 'paragraph-1',
          text: 'Here is what changed in the platform.',
        },
        {
          type: 'image',
          id: 'image-1',
          objectKey: 'email/assets/hero.jpg',
          alt: 'Product screenshot',
        },
        {
          type: 'button',
          id: 'button-1',
          label: 'Open console',
          href: 'https://console.virtality.app',
        },
        {
          type: 'list',
          id: 'list-1',
          items: ['ROM toggle', 'Cast to dashboard'],
          ordered: true,
        },
        {
          type: 'card',
          id: 'card-1',
          heading: 'Sitting mode',
          body: 'Exercises now support seated workflows.',
          imageObjectKey: 'email/assets/sitting.gif',
          imageAlt: 'Sitting mode demo',
          buttonLabel: 'Read more',
          buttonHref: 'https://virtality.app/blog',
        },
        {
          type: 'divider',
          id: 'divider-1',
        },
      ],
    })

    expect(rendered.subject).toBe('June product update')
    expect(rendered.html).toContain('Virtality')
    expect(rendered.html).toContain('June product update')
    expect(rendered.html).toContain('Here is what changed in the platform.')
    expect(rendered.html).toContain(
      'https://cdn.virtality.app/email/assets/hero.jpg',
    )
    expect(rendered.html).toContain('Open console')
    expect(rendered.html).toContain('<ol')
    expect(rendered.html).toContain('Sitting mode')
    expect(rendered.html).toContain('All rights reserved')
  })
})
