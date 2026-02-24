'use server';
import { prisma } from '@virtality/db';
import { MapArraySchema } from '@/types/definitions';
import { Map } from '@virtality/db';
import { getUserAndSession } from './authActions';
export const getMaps = async () => {
  try {
    return await prisma.map.findMany({
      orderBy: { id: 'asc' }, // or 'desc' if you want newest first
    });
  } catch (error) {
    console.error(error);
  }
};

export const updateMaps = async (
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
  const validation = MapArraySchema.safeParse(data);
  if (!validation.success)
    return {
      validationErrors: JSON.stringify(validation.error.issues),
      values: JSON.stringify(data),
    };
  data.array.forEach(async (element: Map) => {
    await prisma.map.update({
      where: {
        id: element.id,
      },
      data: element,
    });
  });

  return { validationErrors: null, values: null };
};
