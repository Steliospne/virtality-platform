'use client';

import { fetchPatients } from '@/data/client/patients';
import { useQuery } from '@tanstack/react-query';

const usePatientList = () => {
  return useQuery({
    queryKey: ['exercises'],
    queryFn: fetchPatients,
    staleTime: 'static',
  });
};
export default usePatientList;
