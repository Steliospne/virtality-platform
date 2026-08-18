import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PatientDashboardValue } from '@/context/patient-dashboard-context'

interface ModeSelectorProps {
  selectedMode: PatientDashboardValue['state']['selectedMode']
  setSelectedMode: PatientDashboardValue['handler']['setSelectedMode']
  programState: PatientDashboardValue['state']['programState']
}

const ModeSelector = ({
  selectedMode,
  setSelectedMode,
  programState,
}: ModeSelectorProps) => {
  const isProgramActive = programState === 'started'
  const isProgramPaused = programState === 'paused'

  return (
    <Select value={selectedMode} onValueChange={setSelectedMode}>
      <SelectTrigger
        disabled={isProgramActive || isProgramPaused}
        className='border dark:border-zinc-600 dark:bg-zinc-900'
      >
        <SelectValue placeholder='Choose Mode...' />
      </SelectTrigger>
      <SelectContent className='dark:bg-zinc-900'>
        <SelectItem key='main' value='main'>
          Normal Mode
        </SelectItem>
        <SelectItem key='free' value='free'>
          Free Mode
        </SelectItem>
      </SelectContent>
    </Select>
  )
}

export default ModeSelector
