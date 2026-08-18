import { MonitorPlay } from 'lucide-react'
import { Button } from '@virtality/ui/components/button'
import { cn } from '@/lib/utils'
import { useFeatureFlagResult } from 'posthog-js/react'

interface CastingButtonProps {
  showCasting: boolean
  setShowCasting: React.Dispatch<React.SetStateAction<boolean>>
}

const CastingButton = ({ showCasting, setShowCasting }: CastingButtonProps) => {
  const res = useFeatureFlagResult('cast_feature')

  if (res?.enabled && res.payload === false) return null

  return (
    <Button onClick={() => setShowCasting((prev) => !prev)}>
      <MonitorPlay
        className={cn(
          'size-6 rounded-sm border p-1',
          showCasting
            ? 'border-green-800/60 bg-green-600/60'
            : 'border-red-800/60 bg-red-600/60',
        )}
      />
      <span className='max-lg:hidden'>Cast</span>
    </Button>
  )
}

export default CastingButton
