import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PresetsTable from './_components/presets-table'
import UserPresetsTable from './_components/user-presets-table'
import { presetColumns } from './_components/preset-column'

const PresetsPage = async () => {
  return (
    <div>
      <Tabs defaultValue='virtality' className='h-screen-with-header p-4'>
        <TabsList className='gap-2'>
          <TabsTrigger value='virtality'>Virtality</TabsTrigger>
          <TabsTrigger value='user'>User</TabsTrigger>
        </TabsList>
        <TabsContent value='virtality' className='flex flex-1 flex-col'>
          <PresetsTable columns={presetColumns} />
        </TabsContent>
        <TabsContent value='user' className='flex flex-1 flex-col'>
          <UserPresetsTable columns={presetColumns} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default PresetsPage
