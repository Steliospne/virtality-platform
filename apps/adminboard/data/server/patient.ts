import { type Patient, prisma } from '@virtality/db';

export const getPatients = async () => {
  try {
    const patients = await prisma.patient.findMany();
    return patients;
  } catch (error) {
    console.log('Error getting patients: ', error);
  }
};

export const getPatient = async (patientId: Patient['id']) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });
    return patient;
  } catch (error) {
    console.log('Error getting patient: ', error);
  }
};
