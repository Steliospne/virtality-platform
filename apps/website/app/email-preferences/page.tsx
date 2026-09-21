import { EmailOptOutFlow } from '@/sections/email-preferences'

type EmailPreferencesPageProps = {
  searchParams: Promise<{ token?: string | string[] }>
}

const EmailPreferencesPage = async ({
  searchParams,
}: EmailPreferencesPageProps) => {
  const { token } = await searchParams
  return <EmailOptOutFlow token={typeof token === 'string' ? token : null} />
}

export default EmailPreferencesPage
