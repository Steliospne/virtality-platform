import { authed } from '../../middleware/auth.ts'
import { z } from 'zod'

const FAKE_PATIENT = {
  name: { contains: 'test' },
}

const INTERNAL_USERS = [
  '5gCcsOn9Tz4IF9ommSp2DvoiJsTsphTw', //Tasos
  '9ygYLzpviL1OapAKamGyLAqqByKsHsnG', //Tasos_Admin
  'OuL7y4Xb2DU2PMIAFnOu4OHqHvMdPfrY', //Stelios
  'PySE5EEdRduUMYaVRDFhIg32agudrY4K', //Stelios_Admin
  'lb88hVACN6FxCPJcLQGzQng3iWg9jVsV', //Katerina
  'UAql4zqL2KMRk1cjwwq5yirDq6pbIw4b', //Katerina_Admin
  'Bhn4gUOtOZZcOh3qQ9VKPiEfAAXCbhx2', //TestUser_1
  'rC5H7G9vjOhvGnM5gagD9bKkFU4JM5rJ', //TestUser_2
  'mb1eDQAdr2sP08gEdggLfOTYbb0RoOug', //Jerry
  'zCPmoGefgoVQfYiP5MZ7C9d8ml9PfljT', //Lefteris
  '9RMfagtuXvlxXVgc0VpBOw2gPq5yISRQ', //Ξανθίππη Κοντογιάννη
  '0glxtznlckihDNxjZAszARJQVLOOhrBp', // Nikos
]

const MIN_WINDOW_DAYS = 3
const ONE_DAY_MS = 24 * 60 * 60 * 1000

type SessionsGranularity = 'day' | 'week'

const SessionsPerDateInput = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
  granularity: z.enum(['day', 'week']).default('week'),
})

const sessionsPerDateInputSchema = SessionsPerDateInput.superRefine(
  (value, ctx) => {
    const fromDay = getUTCDayStart(value.from)
    const toDay = getUTCDayStart(value.to)

    if (fromDay.getTime() > toDay.getTime()) {
      ctx.addIssue({
        code: 'custom',
        path: ['to'],
        message: '"to" must be on or after "from".',
      })
      return
    }

    const daysInWindow = getInclusiveDaysBetween(fromDay, toDay)

    if (daysInWindow < MIN_WINDOW_DAYS) {
      ctx.addIssue({
        code: 'custom',
        path: ['from'],
        message: `Date window must be at least ${MIN_WINDOW_DAYS} days.`,
      })
    }
  },
).optional()

const getUTCDayStart = (date: Date): Date => {
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth()
  const day = date.getUTCDate()

  return new Date(Date.UTC(year, month, day))
}

const getUTCDayAfter = (date: Date): Date => {
  const nextDay = new Date(date)
  nextDay.setUTCDate(nextDay.getUTCDate() + 1)
  return nextDay
}

const toISODate = (date: Date): string => date.toISOString().slice(0, 10)

const getInclusiveDaysBetween = (from: Date, to: Date): number =>
  Math.floor((to.getTime() - from.getTime()) / ONE_DAY_MS) + 1

const getISOWeekStartUTC = (date: Date): Date => {
  const dayStart = getUTCDayStart(date)
  const dayOfWeek = dayStart.getUTCDay() || 7
  const weekStart = new Date(dayStart)
  weekStart.setUTCDate(dayStart.getUTCDate() - dayOfWeek + 1)
  return weekStart
}

const getCurrentWeekWindowUTC = (): { from: Date; to: Date } => {
  const todayStart = getUTCDayStart(new Date())
  const from = getISOWeekStartUTC(todayStart)
  const to = new Date(from)
  to.setUTCDate(from.getUTCDate() + 6)
  return { from, to }
}

const getTotalUniquePatients = authed
  .route({ path: '/dashboard/analytics/total-unique-patients', method: 'GET' })
  .handler(async ({ context }) => {
    const { prisma } = context

    const totalUniquePatients = await prisma.patient.count({
      where: {
        NOT: [FAKE_PATIENT],
        AND: [
          {
            userId: {
              notIn: INTERNAL_USERS,
            },
          },
        ],
      },
    })

    return totalUniquePatients
  })

type UniquePatientsPerPhysio = {
  name: string
  totalPatients: number
}

const getUniquePatientsPerPhysio = authed
  .route({
    path: '/dashboard/analytics/unique-patients-per-physio',
    method: 'GET',
  })
  .handler(async ({ context }): Promise<UniquePatientsPerPhysio[]> => {
    const { prisma } = context

    const res = await prisma.patient.groupBy({
      by: ['userId'],
      _count: { _all: true },
      where: {
        NOT: [FAKE_PATIENT],
        AND: [
          {
            userId: {
              notIn: INTERNAL_USERS,
            },
          },
        ],
      },
    })

    const users = res.reduce((acc, next) => {
      if (!next.userId) return acc
      acc.push(next.userId)
      return acc
    }, [] as string[])

    const userNames = await prisma.user.findMany({
      where: { id: { in: users } },
      select: { name: true, id: true },
    })

    const data = res.reduce((acc, next) => {
      acc.push({
        name: userNames.find((user) => user.id === next?.userId)?.name ?? '',
        totalPatients: next._count._all,
      })
      return acc
    }, [] as UniquePatientsPerPhysio[])

    return data
  })

type SessionsPerPatient = {
  patientId: string
  name: string
  totalSessions: number
} | null

const getSessionsPerPatient = authed
  .route({ path: '/dashboard/analytics/sessions-per-patient', method: 'GET' })
  .handler(async ({ context }): Promise<SessionsPerPatient[]> => {
    const { prisma } = context

    const patients = await prisma.patient.findMany({
      where: {
        NOT: [FAKE_PATIENT],
        AND: [{ userId: { notIn: INTERNAL_USERS } }],
      },
    })

    const sessionsPerPatient = await prisma.patientSession.groupBy({
      by: ['patientId'],
      _count: { _all: true },
      where: {
        NOT: [{ patient: FAKE_PATIENT }],
        AND: [
          {
            completedAt: { not: null },
            patient: {
              userId: {
                notIn: INTERNAL_USERS,
              },
            },
          },
        ],
      },
    })

    const data: SessionsPerPatient[] = sessionsPerPatient.map((item) => {
      const patient = patients.find((patient) => patient.id === item.patientId)

      if (!patient) return null

      return {
        name: patient.name,
        patientId: item.patientId,
        totalSessions: item._count._all,
      }
    })

    return data
  })

const getTotalPatientSessions = authed
  .route({ path: '/dashboard/analytics/total-patient-session', method: 'GET' })
  .handler(async ({ context }) => {
    const { prisma } = context

    const totalPatientSession = await prisma.patientSession.count({
      where: {
        NOT: [{ patient: FAKE_PATIENT }],
        AND: [
          {
            patient: {
              userId: {
                notIn: INTERNAL_USERS,
              },
            },
          },
        ],
      },
    })

    return totalPatientSession
  })

const getPatientSessionsPerDatePerUser = authed
  .route({
    path: '/dashboard/analytics/patient-sessions-per-week-per-user',
    method: 'GET',
  })
  .input(sessionsPerDateInputSchema)
  .handler(async ({ context, input }) => {
    const { prisma } = context

    const defaultWindow = getCurrentWeekWindowUTC()
    const from = input ? getUTCDayStart(input.from) : defaultWindow.from
    const to = input ? getUTCDayStart(input.to) : defaultWindow.to
    const granularity: SessionsGranularity = input?.granularity ?? 'week'

    const sessions = await prisma.patientSession.findMany({
      where: {
        NOT: [{ patient: FAKE_PATIENT }],
        AND: [
          {
            createdAt: {
              gte: from,
              lt: getUTCDayAfter(to),
            },
            patient: {
              userId: {
                notIn: INTERNAL_USERS,
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
    })

    const getBucketStart = (date: Date): Date => {
      if (granularity === 'day') {
        return getUTCDayStart(date)
      }
      return getISOWeekStartUTC(date)
    }

    // Group sessions by userId, then by day/week bucket start date
    type GroupedSessions = Record<
      string,
      Record<string, { bucketStart: string; count: number }>
    >

    const grouped: GroupedSessions = sessions.reduce((acc, session) => {
      if (!session.patient.userId) return acc

      const date = new Date(session.createdAt)
      const userId = session.patient.userId
      const bucketStart = getBucketStart(date)
      const bucketKey = toISODate(bucketStart)

      if (!acc[userId]) {
        acc[userId] = {}
      }

      if (!acc[userId][bucketKey]) {
        acc[userId][bucketKey] = {
          count: 0,
          bucketStart: bucketKey,
        }
      }

      acc[userId][bucketKey].count++

      return acc
    }, {} as GroupedSessions)

    // Get unique user IDs and fetch user names
    const userIds = Object.keys(grouped)

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { name: true, id: true },
    })

    // Map to final format grouped by user
    const result = userIds.map((userId) => {
      if (!grouped[userId]) throw new Error('User not found')
      const userSessions = Object.values(grouped[userId])
      return {
        userId,
        userName: users.find((user) => user.id === userId)?.name ?? '',
        sessions: userSessions.sort((a, b) =>
          a.bucketStart.localeCompare(b.bucketStart),
        ),
      }
    })

    // Sort by userName
    return result.sort((a, b) => a.userName.localeCompare(b.userName))
  })

export const dashboard = {
  getTotalUniquePatients,
  getUniquePatientsPerPhysio,
  getSessionsPerPatient,
  getTotalPatientSessions,
  getPatientSessionsPerDatePerUser,
}
