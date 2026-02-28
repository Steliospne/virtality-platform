'use client'

import { createMapQuery } from '@/data/client/map'
import { useQuery } from '@tanstack/react-query'

const useMapList = () => {
  return useQuery(createMapQuery())
}

export default useMapList
