'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmailAudiencesPanel } from './audiences/email-audiences-panel'
import { EmailOptOutsPanel } from './opt-outs/email-opt-outs-panel'

const AudiencesDashboard = () => {
  return (
    <Tabs defaultValue='audiences'>
      <TabsList>
        <TabsTrigger value='audiences'>Audiences</TabsTrigger>
        <TabsTrigger value='opt-outs'>Opt-outs</TabsTrigger>
      </TabsList>
      <TabsContent value='audiences' className='mt-6'>
        <EmailAudiencesPanel />
      </TabsContent>
      <TabsContent value='opt-outs' className='mt-6'>
        <EmailOptOutsPanel />
      </TabsContent>
    </Tabs>
  )
}

export default AudiencesDashboard
