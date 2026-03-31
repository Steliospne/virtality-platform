'use client'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Mail, Send } from 'lucide-react'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  useEmailTemplate,
  useEmailTemplatePreview,
  useEmailTemplates,
  useSendEmailTemplate,
} from '@virtality/react-query'

const EmailDashboard = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editSubject, setEditSubject] = useState('')
  const [editHtml, setEditHtml] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [hasInitializedEditState, setHasInitializedEditState] = useState(false)

  const { data: templates, isLoading: templatesLoading } = useEmailTemplates()

  const { data: templateDetail, isLoading: detailLoading } =
    useEmailTemplate(selectedId)

  const { data: preview } = useEmailTemplatePreview(selectedId)

  if (templateDetail && !hasInitializedEditState) {
    setEditSubject(templateDetail.subject ?? '')
    setEditHtml(templateDetail.html ?? '')
    setHasInitializedEditState(true)
  }

  const selectedTemplate = templates?.find((t) => t.id === selectedId)

  const handleSelectTemplate = (id: string) => {
    setSelectedId(id)
    setIsEditing(false)
    setHasInitializedEditState(false)
  }

  const sendEmailMutation = useSendEmailTemplate()

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault()
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
        onError: (err: unknown) => {
          toast.error(
            err instanceof Error ? err.message : 'Failed to send email',
          )
        },
      },
    )
  }

  if (templatesLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <p className='text-muted-foreground'>Loading templates...</p>
      </div>
    )
  }

  if (!templates || templates.length === 0) {
    return (
      <div className='flex items-center justify-center py-12'>
        <p className='text-muted-foreground'>No templates found.</p>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-6 max-lg:h-300 lg:grid lg:grid-cols-[300px_1fr] lg:grid-rows-[repeat(17,24px)]'>
      <Card className='overflow-auto lg:row-span-17'>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
          <CardDescription>
            Choose a template to preview and edit
          </CardDescription>
        </CardHeader>
        <CardContent className='flex gap-3 overflow-auto lg:flex-col'>
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => handleSelectTemplate(t.id)}
              className={cn(
                'hover:bg-accent rounded-lg p-3 text-left transition-colors max-lg:min-w-3xs lg:w-full',
                selectedId === t.id ? 'bg-accent' : '',
              )}
            >
              <div className='flex items-start gap-3'>
                <Mail className='text-muted-foreground mt-1 size-4 shrink-0' />
                <div className='flex-1 space-y-1'>
                  <p className='leading-none font-medium'>{t.title}</p>
                  <Badge variant='secondary' className='mt-1 text-xs'>
                    {t.category}
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
                Select a template to preview and edit
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className='flex flex-1 flex-col'>
              <CardHeader>
                <div className='flex items-start justify-between'>
                  <div>
                    <CardTitle>{selectedTemplate?.title}</CardTitle>
                    <CardDescription className='mt-1'>
                      {isEditing
                        ? 'Edit subject and HTML content'
                        : 'Preview with sample data'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='flex flex-1 flex-col space-y-4'>
                {isEditing ? (
                  <>
                    <div>
                      <label className='text-muted-foreground text-sm font-medium'>
                        Subject
                      </label>
                      <Input
                        className='mt-1'
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                        placeholder='Email subject'
                      />
                    </div>
                    <div className='flex flex-1 flex-col'>
                      <label className='text-muted-foreground text-sm font-medium'>
                        HTML (use {'{{url}}'}, {'{{name}}'}, etc. for
                        placeholders)
                      </label>
                      <textarea
                        className='bg-muted/50 mt-2 min-h-[300px] flex-1 rounded-lg border p-4 font-mono text-sm'
                        value={editHtml}
                        onChange={(e) => setEditHtml(e.target.value)}
                        placeholder='Leave empty to use default template. Or paste custom HTML with placeholders.'
                        spellCheck={false}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className='text-muted-foreground text-sm font-medium'>
                        Subject
                      </label>
                      <p className='mt-1 text-lg font-medium'>
                        {detailLoading ? '...' : (preview?.subject ?? '-')}
                      </p>
                    </div>
                    <div className='bg-muted/50 mt-2 min-h-[300px] flex-1 rounded-lg border p-4'>
                      {detailLoading ? (
                        <p className='text-muted-foreground'>
                          Loading preview...
                        </p>
                      ) : preview?.html ? (
                        <iframe
                          className='h-full min-h-[300px] w-full font-sans text-sm leading-relaxed'
                          srcDoc={preview.html}
                          title='Email preview'
                        />
                      ) : (
                        <p className='text-muted-foreground'>
                          No preview available
                        </p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Send test email</CardTitle>
                <CardDescription>
                  Send this template to a specified email address
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleSendEmail}
                  className='flex flex-col gap-3 sm:flex-row sm:items-end'
                >
                  <div className='flex-1'>
                    <label
                      htmlFor='recipient-email'
                      className='text-muted-foreground mb-1.5 block text-sm font-medium'
                    >
                      Recipient email
                    </label>
                    <Input
                      id='recipient-email'
                      type='text'
                      placeholder='recipient@example.com'
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
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

export default EmailDashboard
