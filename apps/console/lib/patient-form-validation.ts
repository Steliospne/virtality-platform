export const PATIENT_SEX_VALUES = ['male', 'female'] as const
export const PATIENT_LANGUAGE_VALUES = ['Greek', 'English'] as const

export type PatientSex = (typeof PATIENT_SEX_VALUES)[number]
export type PatientLanguage = (typeof PATIENT_LANGUAGE_VALUES)[number]

export function isPatientSex(value: string): value is PatientSex {
  return (PATIENT_SEX_VALUES as readonly string[]).includes(value)
}

export function isPatientLanguage(value: string): value is PatientLanguage {
  return (PATIENT_LANGUAGE_VALUES as readonly string[]).includes(value)
}

export function patientSexSelectValue(
  sex: string | null | undefined,
): PatientSex | undefined {
  return sex != null && isPatientSex(sex) ? sex : undefined
}

export function patientLanguageSelectValue(
  language: string | null | undefined,
): PatientLanguage | undefined {
  return language != null && isPatientLanguage(language) ? language : undefined
}
