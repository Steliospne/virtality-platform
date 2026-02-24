'use client';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Mail, Send } from 'lucide-react';
import { Email } from './page';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { sendEmail } from '@/data/client/email';

type Props = {
  payload: Email[];
};

const EmailDashboard = ({ payload }: Props) => {
  const [selectedEmail, setSelectedEmail] = useState<Email>();
  const [recipientEmail, setRecipientEmail] = useState('');

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipientEmail || !recipientEmail.includes('@')) {
      toast.error('Please enter a valid email address');

      return;
    }

    // Simulate API call
    await sendEmail({ recipientEmail, emailId: selectedEmail?.id });

    toast.success(
      `Email sent "${selectedEmail?.title}" sent to ${recipientEmail}`,
    );

    setRecipientEmail('');
    // setSending(false)
  };

  return (
    <div className='flex flex-col gap-6 max-lg:h-300 lg:grid lg:grid-cols-[300px_1fr] lg:grid-rows-[repeat(17,24px)]'>
      <Card className='overflow-auto lg:row-span-17'>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
          <CardDescription>Choose from premade emails</CardDescription>
        </CardHeader>
        <CardContent className='flex gap-3 overflow-auto lg:flex-col'>
          {payload.map((email, index) => (
            <button
              key={index}
              onClick={() => setSelectedEmail(email)}
              className={cn(
                'hover:bg-accent rounded-lg p-3 text-left transition-colors max-lg:min-w-3xs lg:w-full',
                selectedEmail?.id === email.id ? 'bg-accent' : '',
              )}
            >
              <div className='flex items-start gap-3'>
                <Mail className='text-muted-foreground mt-1 size-4 shrink-0' />
                <div className='flex-1 space-y-1'>
                  <p className='leading-none font-medium'>{email.title}</p>
                  {/* <p className="text-sm text-muted-foreground line-clamp-1">{email.subject}</p> */}
                  <Badge variant='secondary' className='mt-1 text-xs'>
                    {email.category}
                  </Badge>
                </div>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      <div className='flex flex-1 flex-col space-y-6 lg:row-span-17'>
        {/* Preview */}
        <Card className='flex flex-1 flex-col'>
          <CardHeader>
            <div className='flex items-start justify-between'>
              <div>
                <CardTitle>{selectedEmail?.title}</CardTitle>
                <CardDescription className='mt-1'>
                  Preview before sending
                </CardDescription>
              </div>
              <Badge>{selectedEmail?.category}</Badge>
            </div>
          </CardHeader>
          <CardContent className='flex flex-1 flex-col space-y-4'>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                Subject
              </label>
              <p className='mt-1 text-lg font-medium'></p>
            </div>

            <div className='bg-muted/50 mt-2 flex-1 rounded-lg border p-4'>
              <iframe
                className='h-full w-full font-sans text-sm leading-relaxed whitespace-pre-wrap'
                srcDoc={selectedEmail?.html}
              />
            </div>
          </CardContent>
        </Card>

        {/* Send Form */}
        <Card>
          <CardHeader>
            <CardTitle>Send Email</CardTitle>
            <CardDescription>Enter recipient's email address</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendEmail} className='flex gap-3'>
              <Input
                type='email'
                placeholder='recipient@example.com'
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className='flex-1'
                required
              />
              <Button
                type='submit'
                // disabled={sending}
              >
                <Send className='mr-2 size-4' />
                Send
                {/* {sending ? "Sending..." : "Send"} */}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailDashboard;
