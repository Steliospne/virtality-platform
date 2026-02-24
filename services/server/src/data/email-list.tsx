import MeetVirtality from '@virtality/ui/components/email/meet-virtality'
import { JSXNode, createElement } from 'hono/jsx'

export type Email = {
  id: string | number
  title: string
  subject: string
  category?: string
  component: JSXNode
}

type MeetVirtalityReturnType = ReturnType<typeof MeetVirtality>

export const emails: Email[] = [
  {
    id: 0,
    title: 'Meet Virtality',
    subject: 'Meet Virtality',
    category: 'onboarding',
    component: createElement(MeetVirtality, {}),
  },
]
