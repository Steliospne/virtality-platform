'use server';
import { prisma } from '@virtality/db';

const fakePatient = {
  name: { contains: 'test' },
};

const internalUser = [
  '5gCcsOn9Tz4IF9ommSp2DvoiJsTsphTw', //Tasos
  'PySE5EEdRduUMYaVRDFhIg32agudrY4K', //Stelios
  'UAql4zqL2KMRk1cjwwq5yirDq6pbIw4b', //Katerina
  'rC5H7G9vjOhvGnM5gagD9bKkFU4JM5rJ', //TestUser_2
  'mb1eDQAdr2sP08gEdggLfOTYbb0RoOug', //Jerry
  'zCPmoGefgoVQfYiP5MZ7C9d8ml9PfljT', //Lefteris
  'Bhn4gUOtOZZcOh3qQ9VKPiEfAAXCbhx2', //TestUser_1
  '9RMfagtuXvlxXVgc0VpBOw2gPq5yISRQ', //Ξανθίππη Κοντογιάννη
  '0glxtznlckihDNxjZAszARJQVLOOhrBp', // Nikos
];

export const getTotalUniquePatients = async () => {
  return await prisma.patient.count({
    where: {
      NOT: [fakePatient],
      AND: [
        {
          userId: {
            notIn: internalUser,
          },
        },
      ],
    },
  });
};

export const getUniquePatientsPerDoc = async () => {
  const res = await prisma.patient.groupBy({
    by: ['userId'],
    _count: { _all: true },
    where: {
      NOT: [fakePatient],
      AND: [
        {
          userId: {
            notIn: internalUser,
          },
        },
      ],
    },
  });

  const users = res.reduce((acc, next) => {
    if (!next.userId) return acc;
    acc.push(next.userId);
    return acc;
  }, [] as string[]);

  const userNames = await prisma.user.findMany({
    where: { id: { in: users } },
    select: { name: true, id: true },
  });

  const data = res.reduce(
    (acc, next) => {
      acc.push({
        name: userNames.find((user) => user.id === next?.userId)?.name ?? '',
        totalPatients: next._count._all,
      });
      return acc;
    },
    [] as { name: string; totalPatients: number }[],
  );

  return data;
};

export const getSessionsPerPatient = async (): Promise<
  Array<{ patientId: string | null; _count: { _all: number } }>
> => {
  const res = await prisma.patientSession.groupBy({
    by: ['patientId'],
    _count: { _all: true },
    where: {
      NOT: [{ patient: fakePatient }],
      AND: [
        {
          patient: {
            userId: {
              notIn: internalUser,
            },
          },
        },
      ],
    },
  });

  return res;
};

export const getTotalPatientSession = async () => {
  const res = await prisma.patientSession.count({
    where: {
      NOT: [{ patient: fakePatient }],
      AND: [
        {
          patient: {
            userId: {
              notIn: internalUser,
            },
          },
        },
      ],
    },
  });

  return res;
};

export const getPatientSessionsPerWeekPerUser = async () => {
  const sessions = await prisma.patientSession.findMany({
    where: {
      NOT: [{ patient: fakePatient }],
      AND: [
        {
          patient: {
            userId: {
              notIn: internalUser,
            },
          },
        },
      ],
    },
    select: {
      createdAt: true,
      patient: {
        select: {
          userId: true,
        },
      },
    },
  });

  // Helper function to get ISO week number and year
  const getWeekNumber = (date: Date): { week: number; year: number } => {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil(
      ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
    );
    return { week, year: d.getUTCFullYear() };
  };

  // Group sessions by userId, then by week/year
  const grouped = sessions.reduce(
    (acc, session) => {
      if (!session.patient.userId) return acc;

      const date = new Date(session.createdAt);
      const { week, year } = getWeekNumber(date);
      const userId = session.patient.userId;

      if (!acc[userId]) {
        acc[userId] = {};
      }

      const weekKey = `${year}_${week}`;
      if (!acc[userId][weekKey]) {
        acc[userId][weekKey] = {
          count: 0,
          week,
          year,
        };
      }
      acc[userId][weekKey].count++;
      return acc;
    },
    {} as Record<
      string,
      Record<string, { week: number; year: number; count: number }>
    >,
  );

  // Get unique user IDs and fetch user names
  const userIds = Object.keys(grouped);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { name: true, id: true },
  });

  // Map to final format grouped by user
  const result = userIds.map((userId) => {
    if (!grouped[userId]) throw new Error('User not found');
    const userSessions = Object.values(grouped[userId]);
    return {
      userId,
      userName: users.find((user) => user.id === userId)?.name ?? '',
      sessions: userSessions.sort((a, b) => {
        if (a.year !== b.year) {
          return b.year - a.year;
        }
        return b.week - a.week;
      }),
    };
  });

  // Sort by userName
  return result.sort((a, b) => a.userName.localeCompare(b.userName));
};
