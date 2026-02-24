import { prisma } from '@virtality/db'

export const getPatients = async (userId: string) => {
  // const user = await getUser();
  // if (!user) throw Error('You must be signed in to perform this action.');
  try {
    const patients = await prisma.patient.findMany({
      where: {
        userId,
        AND: [
          {
            deletedAt: null,
          },
        ],
      },
    })
    return patients
  } catch (error) {
    console.log('Error getting patients: ', error)
  }
}

export const getPatientByID = async (id: string) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: {
        id,
        AND: [
          {
            deletedAt: null,
          },
        ],
      },
    })
    return patient
  } catch (error) {
    console.error('Error getting patient by ID: ', error)
    return null
  }
}
