import Devices from './_components'
import { DeviceContextProvider } from '@/context/device-context'

const DevicesPage = async () => {
  return (
    <DeviceContextProvider>
      <Devices />
    </DeviceContextProvider>
  )
}

export default DevicesPage
