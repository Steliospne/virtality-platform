export const PATIENT_SEX_VALUES = ['male', 'female'] as const

export type PatientSex = (typeof PATIENT_SEX_VALUES)[number]

export function patientSexSelectValue(
  sex: string | null | undefined,
): PatientSex | undefined {
  if (sex === 'male' || sex === 'female') return sex
  return undefined
}
