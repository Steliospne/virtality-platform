import { getEmails } from '@/data/client/email';
import EmailDashboard from './email-dashboard';

export type Email = {
  id: string | number;
  title: string;
  category: string;
  html: string;
};

const EmailPage = async () => {
  const payload = await getEmails();
  return (
    <div className='min-h-screen-with-header mx-auto max-w-7xl px-4 py-6'>
      <div className='mb-8'>
        <h1 className='text-4xl font-bold tracking-tight'>Email Templates</h1>
        <p className='text-muted-foreground mt-2'>
          Select a template, preview it, and send it to anyone
        </p>
      </div>
      <EmailDashboard payload={payload} />
    </div>
  );
};

export default EmailPage;
