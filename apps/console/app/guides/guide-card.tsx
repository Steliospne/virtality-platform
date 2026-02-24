'use client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { H2, P } from '@/components/ui/typography'
import Video from '@/components/ui/video'
import { Guide } from '@/data/static/guides'
import { Info } from 'lucide-react'
import Link from 'next/link'

interface GuideCardProps {
  item: Guide
}

const GuideCard = ({ item }: GuideCardProps) => {
  return (
    <Card>
      <CardContent className='flex gap-6'>
        <Video
          src={item.videoURL}
          controls
          className='flex min-w-[300px] cursor-pointer overflow-hidden rounded-lg'
        />
        <section className='flex items-center'>
          <div>
            <H2>{item.title}</H2>
            <P>{item.description}</P>
            {item.metaData?.additionalInfoURL && (
              <div className='flex items-center gap-2'>
                <>
                  <Info className='size-4' />
                  <span>Additional Info:</span>
                  <Link
                    href={item.metaData?.additionalInfoURL || ''}
                    target='_blank'
                    className='text-vital-blue-700 hover:underline'
                  >
                    {item.metaData?.additionalInfoURL}
                  </Link>
                </>
              </div>
            )}
          </div>
        </section>
      </CardContent>
    </Card>
  )
}

export default GuideCard
