'use server';
import { prisma, type PresetExercise } from '@virtality/db';

export const createPresetExercises = async (exercises: PresetExercise[]) => {
  const data = exercises.map((exercise) => ({
    ...exercise,
    reps: Number(exercise.reps),
    sets: Number(exercise.sets),
    restTime: Number(exercise.restTime),
    speed: Number(exercise.speed),
  }));
  await prisma.presetExercise.createMany({ data });
};

export const updatePresetExercises = async (exercises: PresetExercise[]) => {
  const data = exercises.map((exercise) => ({
    ...exercise,
    reps: Number(exercise.reps),
    sets: Number(exercise.sets),
    restTime: Number(exercise.restTime),
    speed: Number(exercise.speed),
  }));

  console.log(data);

  if (data.length > 0) {
    const presetId = data[0]?.presetId;

    await prisma.presetExercise.deleteMany({ where: { presetId } });
  }

  await prisma.presetExercise.createMany({ data });
};
