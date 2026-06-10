'use client'

import { Badge } from '@virtality/ui/components/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@virtality/ui/components/card'
import { Mail, Send } from 'lucide-react'
import { useState } from 'react'
import { Input } from '@virtality/ui/components/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  useEmailTemplate,
  useEmailTemplatePreview,
  useEmailTemplates,
  useSendEmailTemplate,
} from '@virtality/react-query'

export const SystemEmailsPanel = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [recipientEmail, setRecipientEmail] = useState('')

  const { data: templates, isLoading: templatesLoading } = useEmailTemplates()
  const { data: templateDetail, isLoading: detailLoading } =
    useEmailTemplate(selectedId)
  const { data: preview } = useEmailTemplatePreview(selectedId)
  const sendEmailMutation = useSendEmailTemplate()

  const selectedTemplate = templates?.find((template) => template.id === selectedId)

  const handleSelectTemplate = (id: string) => {
    setSelectedId(id)
  }

  const handleSendEmail = (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedId || !recipientEmail?.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    sendEmailMutation.mutate(
      {
        templateId: selectedId,
        recipientEmail: recipientEmail.trim(),
      },
      {
        onSuccess: () => {
          toast.success(`Email sent to ${recipientEmail.trim()}`)
          setRecipientEmail('')
        },
        onError: (error: unknown) => {
          toast.error(
            error instanceof Error ? error.message : 'Failed to send email',
          )
        },
      },
    )
  }

  if (templatesLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <p className='text-muted-foreground'>Loading system emails...</p>
      </div>
    )
  }

  if (!templates || templates.length === 0) {
    return (
      <div className='flex items-center justify-center py-12'>
        <p className='text-muted-foreground'>No system emails found.</p>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-6 max-lg:h-300 lg:grid lg:grid-cols-[300px_1fr] lg:grid-rows-[repeat(17,24px)]'>
      <Card className='overflow-auto lg:row-span-17'>
        <CardHeader>
          <CardTitle>System emails</CardTitle>
          <CardDescription>
            Code-owned account and product emails. Preview or test-send only.
          </CardDescription>
        </CardHeader>
        <CardContent className='flex gap-3 overflow-auto lg:flex-col'>
          {templates.map((template) => (
            <button
              key={template.id}
              type='button'
              onClick={() => handleSelectTemplate(template.id)}
              className={cn(
                'hover:bg-accent rounded-lg p-3 text-left transition-colors max-lg:min-w-3xs lg:w-full',
                selectedId === template.id ? 'bg-accent' : '',
              )}
            >
              <div className='flex items-start gap-3'>
                <Mail className='text-muted-foreground mt-1 size-4 shrink-0' />
                <div className='flex-1 space-y-1'>
                  <p className='leading-none font-medium'>{template.title}</p>
                  <Badge variant='secondary' className='mt-1 text-xs'>
                    {template.category}
                  </Badge>
                </div>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      <div className='flex flex-1 flex-col space-y-6 lg:row-span-17'>
        {!selectedId ? (
          <Card className='flex flex-1 flex-col'>
            <CardContent className='flex flex-1 items-center justify-center py-12'>
              <p className='text-muted-foreground'>
                Select a system email to preview
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className='flex flex-1 flex-col'>
              <CardHeader>
                <CardTitle>{selectedTemplate?.title}</CardTitle>
                <CardDescription>
                  Preview with sample data. System emails are not edited here.
                </CardDescription>
              </CardHeader>
              <CardContent className='flex flex-1 flex-col space-y-4'>
                <div>
                  <label className='text-muted-foreground text-sm font-medium'>
                    Subject
                  </label>
                  <p className='mt-1 text-lg font-medium'>
                    {detailLoading ? '...' : (preview?.subject ?? templateDetail?.subject ?? '-')}
                  </p>
                </div>
                <div className='bg-muted/50 mt-2 min-h-[300px] flex-1 rounded-lg border p-4'>
                  {detailLoading ? (
                    <p className='text-muted-foreground'>Loading preview...</p>
                  ) : preview?.html ? (
                    <iframe
                      className='h-full min-h-[300px] w-full font-sans text-sm leading-relaxed'
                      srcDoc={preview.html}
                      title='Email preview'
                    />
                  ) : (
                    <p className='text-muted-foreground'>No preview available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Send test email</CardTitle>
                <CardDescription>
                  Send this system email to a specified address
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleSendEmail}
                  className='flex flex-col gap-3 sm:flex-row sm:items-end'
                >
                  <div className='flex-1'>
                    <label
                      htmlFor='system-recipient-email'
                      className='text-muted-foreground mb-1.5 block text-sm font-medium'
                    >
                      Recipient email
                    </label>
                    <Input
                      id='system-recipient-email'
                      type='text'
                      placeholder='recipient@example.com'
                      value={recipientEmail}
                      onChange={(event) => setRecipientEmail(event.target.value)}
                      className='w-full'
                      required
                    />
                  </div>
                  <Button type='submit' disabled={sendEmailMutation.isPending}>
                    <Send className='mr-2 size-4' />
                    {sendEmailMutation.isPending ? 'Sending...' : 'Send'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
