'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminAuthoredEmailsPanel } from './admin-authored-emails-panel'
import { EmailAudiencesPanel } from './audiences/email-audiences-panel'
import { EmailOptOutsPanel } from './opt-outs/email-opt-outs-panel'
import { SystemEmailsPanel } from './system-emails-panel'

const EmailsDashboard = () => {
  return (
    <Tabs defaultValue='admin-authored'>
      <TabsList>
        <TabsTrigger value='admin-authored'>Admin-authored emails</TabsTrigger>
        <TabsTrigger value='audiences'>Audiences</TabsTrigger>
        <TabsTrigger value='opt-outs'>Opt-outs</TabsTrigger>
        <TabsTrigger value='system'>System emails</TabsTrigger>
      </TabsList>
      <TabsContent value='admin-authored' className='mt-6'>
        <AdminAuthoredEmailsPanel />
      </TabsContent>
      <TabsContent value='audiences' className='mt-6'>
        <EmailAudiencesPanel />
      </TabsContent>
      <TabsContent value='opt-outs' className='mt-6'>
        <EmailOptOutsPanel />
      </TabsContent>
      <TabsContent value='system' className='mt-6'>
        <SystemEmailsPanel />
      </TabsContent>
    </Tabs>
  )
}

export default EmailsDashboard
