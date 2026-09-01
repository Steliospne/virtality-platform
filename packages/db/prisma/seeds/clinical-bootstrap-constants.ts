/** Stable IDs for local clinical bootstrap seed (idempotent upserts). */
export const CLINICAL_SEED = {
  exercises: [
    {
      id: 'e0000000-0000-4000-8000-000000000001',
      name: 'dev_shoulder_flexion',
      displayName: 'Shoulder Flexion (dev)',
      category: 'upper_limb',
      direction: 'flexion',
      description: 'Dev seed exercise for local console browsing.',
    },
    {
      id: 'e0000000-0000-4000-8000-000000000002',
      name: 'dev_reach_forward',
      displayName: 'Reach Forward (dev)',
      category: 'upper_limb',
      direction: 'reach',
      description: 'Second dev seed exercise for program composition.',
    },
  ],
  patients: [
    {
      id: 'p0000000-0000-4000-8000-000000000001',
      name: 'Alex Patient',
      email: 'alex.patient@virtality.local',
    },
    {
      id: 'p0000000-0000-4000-8000-000000000002',
      name: 'Sam Patient',
      email: 'sam.patient@virtality.local',
    },
    {
      id: 'p0000000-0000-4000-8000-000000000003',
      name: 'Jordan Patient',
      email: 'jordan.patient@virtality.local',
    },
  ],
  reusablePrograms: [
    {
      id: 'r0000000-0000-4000-8000-000000000001',
      name: 'Dev Upper Limb Starter',
    },
    {
      id: 'r0000000-0000-4000-8000-000000000002',
      name: 'Dev Reach Practice',
    },
  ],
  patientPrograms: [
    {
      id: 'g0000000-0000-4000-8000-000000000001',
      name: 'Alex - Week 1',
      patientId: 'p0000000-0000-4000-8000-000000000001',
    },
    {
      id: 'g0000000-0000-4000-8000-000000000002',
      name: 'Sam — Orientation',
      patientId: 'p0000000-0000-4000-8000-000000000002',
    },
  ],
  programExercises: [
    {
      id: 'x0000000-0000-4000-8000-000000000001',
      programId: 'g0000000-0000-4000-8000-000000000001',
      exerciseId: 'e0000000-0000-4000-8000-000000000001',
    },
    {
      id: 'x0000000-0000-4000-8000-000000000002',
      programId: 'g0000000-0000-4000-8000-000000000001',
      exerciseId: 'e0000000-0000-4000-8000-000000000002',
    },
    {
      id: 'x0000000-0000-4000-8000-000000000003',
      programId: 'g0000000-0000-4000-8000-000000000002',
      exerciseId: 'e0000000-0000-4000-8000-000000000002',
    },
  ],
  reusableProgramExercises: [
    {
      id: 'y0000000-0000-4000-8000-000000000001',
      reusableProgramId: 'r0000000-0000-4000-8000-000000000001',
      exerciseId: 'e0000000-0000-4000-8000-000000000001',
      position: 0,
    },
    {
      id: 'y0000000-0000-4000-8000-000000000002',
      reusableProgramId: 'r0000000-0000-4000-8000-000000000001',
      exerciseId: 'e0000000-0000-4000-8000-000000000002',
      position: 1,
    },
    {
      id: 'y0000000-0000-4000-8000-000000000003',
      reusableProgramId: 'r0000000-0000-4000-8000-000000000002',
      exerciseId: 'e0000000-0000-4000-8000-000000000002',
      position: 0,
    },
  ],
  session: {
    id: 's0000000-0000-4000-8000-000000000001',
    patientId: 'p0000000-0000-4000-8000-000000000001',
    programId: 'g0000000-0000-4000-8000-000000000001',
  },
  sessionExercise: {
    id: 'z0000000-0000-4000-8000-000000000001',
    exerciseId: 'e0000000-0000-4000-8000-000000000001',
  },
  sessionData: {
    id: 'd0000000-0000-4000-8000-000000000001',
    value: JSON.stringify({
      source: 'local-seed',
      repsCompleted: 8,
      note: 'Small session data blob for local console.',
    }),
  },
  device: {
    id: 'v0000000-0000-4000-8000-000000000001',
    deviceId: 'dev-headset-local-001',
    name: 'Dev Headset',
    model: 'Quest (local seed)',
  },
} as const
