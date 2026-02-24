import { Email } from '@/app/email/page';

const baseURL = process.env.NEXT_PUBLIC_AUTH_URL;

if (!baseURL) {
  throw Error('NEXT_PUBLIC_AUTH_URL environment variable is required');
}

export const getEmails = async () => {
  const res = await fetch(`${baseURL}/api/v1/email`);
  const { payload } = (await res.json()) as { payload: Email[] };
  return payload;
};

export const sendEmail = async ({
  recipientEmail,
  emailId,
}: {
  recipientEmail: string;
  emailId?: string | number;
}) => {
  await fetch(`${baseURL}/api/v1/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ emailId, email: recipientEmail }),
  });
};
