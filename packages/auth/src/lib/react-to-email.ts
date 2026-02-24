import { pretty, render } from '@react-email/render'

export const reactToHTML = async (email: React.ReactNode) => {
  return await pretty(await render(email))
}
