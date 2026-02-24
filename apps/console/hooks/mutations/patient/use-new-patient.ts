'use client'

import { orpc } from '@/integrations/orpc/client'
// import {
//   createNewPatientMutation,
//   NewPatientMutationOptions,
// } from '@/data/client/patient'
// import { useMutation } from '@tanstack/react-query'

// type NewPatientOnSuccess = NewPatientMutationOptions['onSuccess']

// interface useNewPatientProps {
//   onSuccess?: NewPatientOnSuccess
// }

// const useNewPatient = ({ onSuccess }: useNewPatientProps) => {
//   return useMutation({ ...createNewPatientMutation(), onSuccess })
// }

// export default useNewPatient

import { useMutation } from '@tanstack/react-query'

type CreatePatientMutationOptions = ReturnType<
  typeof orpc.patient.create.mutationOptions
>
type NewPatientOnSuccess = NonNullable<
  CreatePatientMutationOptions['onSuccess']
>

const useNewPatient = ({ onSuccess }: { onSuccess?: NewPatientOnSuccess }) => {
  return useMutation(orpc.patient.create.mutationOptions({ onSuccess }))
}

export default useNewPatient
