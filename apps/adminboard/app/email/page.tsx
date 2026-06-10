import EmailsDashboard from '@/components/email/emails-dashboard'

const EmailPage = () => {
  return (
    <div className='min-h-screen-with-header mx-auto max-w-7xl px-4 py-6'>
      <div className='mb-8'>
        <h1 className='text-4xl font-bold tracking-tight'>Emails</h1>
        <p className='text-muted-foreground mt-2'>
          Compose admin-authored announcements or preview code-owned system emails.
        </p>
      </div>
      <EmailsDashboard />
    </div>
  )
}

export default EmailPage
