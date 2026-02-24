import PresetEditForm from '@/app/(pages)/preset/preset-edit-form/index'
import { H2 } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ExerciseLibraryProvider } from '@/context/exercise-library-context'
import { getServerT } from '@/i18n/get-server-t'

const PresetEditPage = async ({
  params,
}: {
  params: Promise<{ id: string }>
}) => {
  const { id } = await params
  const { t } = await getServerT('common')

  return (
    <div
      id='preset_root'
      className='h-screen-with-header flex flex-col gap-4 p-8'
    >
      <div className='flex justify-between'>
        <H2>Edit Preset</H2>
        <div className='flex gap-2'>
          <Button>
            <Link href={`/presets`}>{t('btn.cancel')}</Link>
          </Button>
          <Button form='presetForm' variant='primary'>
            {t('btn.submit')}
          </Button>
        </div>
      </div>
      <ExerciseLibraryProvider>
        <PresetEditForm id={id} />
      </ExerciseLibraryProvider>
    </div>
  )
}

export default PresetEditPage
