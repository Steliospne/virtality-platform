'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminAuthoredEmailsPanel } from './admin-authored-emails-panel'
import { SystemEmailsPanel } from './system-emails-panel'

const EmailsDashboard = () => {
  return (
    <Tabs defaultValue='admin-authored'>
      <TabsList>
        <TabsTrigger value='admin-authored'>Admin-authored emails</TabsTrigger>
        <TabsTrigger value='system'>System emails</TabsTrigger>
      </TabsList>
      <TabsContent value='admin-authored' className='mt-6'>
        <AdminAuthoredEmailsPanel />
      </TabsContent>
      <TabsContent value='system' className='mt-6'>
        <SystemEmailsPanel />
      </TabsContent>
    </Tabs>
  )
}

export default EmailsDashboard
