import { Card, CardContent, CardFooter, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
  TooltipArrow,
} from '@/components/ui/tooltip'
import { Info, X } from 'lucide-react'
import Image from 'next/image'
import placeholder from '@/public/placeholder.svg'
import { Map } from '@virtality/db'
import { MouseEvent } from 'react'
import { usePatientDashboard } from '@/context/patient-dashboard-context'
import { Button } from '@/components/ui/button'
import usePatient from '@/hooks/queries/patient/use-patient'
import useMap from '@/hooks/queries/use-map'

const MapSelector = () => {
  const { state, handler, store, patientLocalData, patientId } =
    usePatientDashboard()
  const { selectedMap, programState } = state
  const { setSelectedMap } = handler
  const { data: maps } = useMap(),
    { data: patient } = usePatient({ patientId })

  const mapChange = (value: string) => {
    const map = maps?.find((map) => map.id === value) ?? null
    store?.setRow('patients', patient!.id, {
      ...patientLocalData,
      lastMap: map?.id ?? '',
    })
    setSelectedMap(map)
  }

  const mapSelectionClear = (e: MouseEvent) => {
    e.stopPropagation()
    store?.delCell('patients', patient!.id, 'lastMap')
    setSelectedMap(null)
  }

  const isProgramActive = programState === 'started'
  const isProgramPaused = programState === 'paused'

  return (
    <div className='relative'>
      <Select value={selectedMap?.id ?? ''} onValueChange={mapChange}>
        <SelectTrigger
          disabled={isProgramActive || isProgramPaused}
          className='w-full border dark:dark:border-zinc-600 dark:bg-zinc-900'
        >
          {selectedMap ? (
            <MapCard map={selectedMap} />
          ) : (
            <SelectValue placeholder='Select a Map' />
          )}
        </SelectTrigger>
        <SelectContent className='dark:bg-zinc-900'>
          {maps &&
            maps.map((map) => (
              <SelectItem key={map.id} value={map.id}>
                <MapCard map={map} />
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      {selectedMap && (
        <Button
          disabled={isProgramActive || isProgramPaused}
          variant='ghost'
          size='icon-sm'
          onClick={mapSelectionClear}
          className='absolute top-1.5 right-8 size-6 cursor-pointer hover:bg-zinc-700/90'
        >
          <X />
        </Button>
      )}
    </div>
  )
}

export default MapSelector

const MapCard = ({ map }: { map: Map }) => {
  return (
    <div className='flex items-center gap-2'>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Info />
            </div>
          </TooltipTrigger>
          <TooltipContent asChild>
            <Card className='max-w-(--breakpoint-sm) gap-2 bg-zinc-50 p-4 text-zinc-950 shadow-none dark:bg-zinc-950 dark:text-zinc-200'>
              <CardContent className='p-0'>
                <Image
                  alt='Map image'
                  width={150}
                  height={150}
                  loading='eager'
                  src={map.image ? map.image : placeholder}
                  className='rounded-lg'
                />
              </CardContent>
              <CardFooter className='p-0'>
                <CardTitle className='text-xl'>{map.name}</CardTitle>
              </CardFooter>
              <TooltipArrow />
            </Card>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <p>{map.name}</p>
    </div>
  )
}
