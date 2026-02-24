'use server';
import { prisma } from '@virtality/db';
import { PatientArraySchema } from '@/types/definitions';
import { Patient } from '@virtality/db';
import { getUserAndSession } from './authActions';
export const getPatients = async () => {
  try {
    return await prisma.patient.findMany({
      orderBy: { id: 'asc' }, // or 'desc' if you want newest first
    });
  } catch (error) {
    console.error(error);
  }
};

export const updatePatients = async (
  state: {
    validationErrors: string | null;
    values: string | null;
  },
  formData?: FormData,
) => {
  const session = await getUserAndSession();
  if (!session || !formData) return { validationErrors: null, values: null };

  const entries = Object.fromEntries(formData);
  const { inputs } = entries;
  const data = JSON.parse(inputs as string);
  const validation = PatientArraySchema.safeParse(data);
  if (!validation.success)
    return {
      validationErrors: JSON.stringify(validation.error.issues),
      values: JSON.stringify(data),
    };
  data.array.forEach(async (element: Patient) => {
    await prisma.patient.update({
      where: {
        id: element.id,
      },
      data: element,
    });
  });

  return { validationErrors: null, values: null };
};
