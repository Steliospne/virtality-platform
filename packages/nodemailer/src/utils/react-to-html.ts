import { ReactNode } from 'react'
import { pretty, render } from '@react-email/render'

export const reactToHTML = async (email: ReactNode) => {
  return await pretty(await render(email))
}
