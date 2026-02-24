import PresetForm from '@/app/(pages)/preset/preset-form'
import { Button } from '@/components/ui/button'
import { H2 } from '@/components/ui/typography'
import { ExerciseLibraryProvider } from '@/context/exercise-library-context'
import { getServerT } from '@/i18n/get-server-t'
import { getUser } from '@/lib/authActions'
import Link from 'next/link'

const PresetCreationPage = async () => {
  const user = await getUser()
  if (!user) return

  const { t } = await getServerT('common')

  return (
    <div
      id='preset_root'
      className='h-screen-with-header flex flex-col gap-4 p-8'
    >
      <div className='flex justify-between'>
        <H2>Create Preset</H2>
        <div className='flex gap-2'>
          <Button asChild>
            <Link href={`/presets`}>{t('btn.cancel')}</Link>
          </Button>
          <Button form='presetForm' variant='primary'>
            Submit
          </Button>
        </div>
      </div>
      <ExerciseLibraryProvider>
        <PresetForm user={user} />
      </ExerciseLibraryProvider>
    </div>
  )
}

export default PresetCreationPage
