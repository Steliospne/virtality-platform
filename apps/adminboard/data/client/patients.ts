import { Patient } from '@virtality/db';

export const fetchPatients = async () => {
  const data = await fetch(`/api/v1/patients`);

  const { patients } = await data.json();
  return patients as Patient[];
};

export const fetchPatient = async (patientId: string) => {
  const data = await fetch(`/api/v1/patients/${patientId}`);

  const { patient } = await data.json();
  return patient as Patient;
};
