'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type AdminEmailDraftPreviewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  subject: string
  html: string | undefined
  isLoading: boolean
}

export const AdminEmailDraftPreviewDialog = ({
  open,
  onOpenChange,
  subject,
  html,
  isLoading,
}: AdminEmailDraftPreviewDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] max-w-4xl overflow-hidden'>
        <DialogHeader>
          <DialogTitle>Email preview</DialogTitle>
          <DialogDescription>
            Review the rendered email with the locked brand shell.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-3 overflow-y-auto'>
          <p className='text-lg font-medium'>{subject}</p>
          <div className='bg-muted/50 min-h-[420px] rounded-lg border p-4'>
            {html ? (
              <iframe
                className='h-full min-h-[420px] w-full'
                srcDoc={html}
                title='Email preview'
              />
            ) : (
              <p className='text-muted-foreground text-sm'>
                {isLoading ? 'Loading preview...' : 'Preview unavailable'}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
