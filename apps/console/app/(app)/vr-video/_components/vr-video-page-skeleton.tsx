import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@virtality/ui/components/card'
import { HeadsetLibrarySkeleton } from './headset-library-skeleton'
import { HeadsetListSkeleton } from './headset-list-skeleton'

export function VrVideoPageSkeleton() {
  return (
    <div className='flex flex-col gap-6 p-8'>
      <div className='grid gap-4 lg:grid-cols-3'>
        <Card className='lg:col-span-1'>
          <CardHeader>
            <CardTitle>Headsets</CardTitle>
          </CardHeader>
          <CardContent>
            <HeadsetListSkeleton />
          </CardContent>
        </Card>
        <Card className='lg:col-span-2'>
          <CardContent className='pt-6'>
            <HeadsetLibrarySkeleton />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
