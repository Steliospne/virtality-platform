import { authed } from '../../middleware/auth.ts'
import { z } from 'zod'
import {
  FAKE_PATIENT,
  INTERNAL_USERS,
  patientScopeFilter,
  UNKNOWN_OWNER_ID,
} from './analytics-filters.ts'
import { buildEffectivenessReport } from './effectiveness-report-aggregation.ts'

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

const EffectivenessReportInput = z
  .object({
    from: z.coerce.date(),
    to: z.coerce.date(),
  })
  .superRefine((value, ctx) => {
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
  })

const getDefaultEffectivenessWindowUTC = (): { from: Date; to: Date } => {
  const to = getUTCDayStart(new Date())
  const from = new Date(to)
  from.setUTCDate(from.getUTCDate() - 29)
  return { from, to }
}

const getEffectivenessReport = authed
  .route({
    path: '/dashboard/analytics/effectiveness-report',
    method: 'GET',
  })
  .input(EffectivenessReportInput.optional())
  .handler(async ({ context, input }) => {
    const { prisma } = context

    const defaultWindow = getDefaultEffectivenessWindowUTC()
    const from = input ? getUTCDayStart(input.from) : defaultWindow.from
    const to = input ? getUTCDayStart(input.to) : defaultWindow.to
    const toExclusive = getUTCDayAfter(to)

    const patients = await prisma.patient.findMany({
      where: patientScopeFilter,
      select: {
        id: true,
        userId: true,
      },
    })

    const sessions = await prisma.patientSession.findMany({
      where: {
        deletedAt: null,
        completedAt: {
          not: null,
          gte: from,
          lt: toExclusive,
        },
        status: 'COMPLETED',
        patient: patientScopeFilter,
      },
      select: {
        patientId: true,
        createdAt: true,
        completedAt: true,
        sessionData: {
          select: {
            value: true,
          },
        },
        sessionExercise: {
          select: {
            sets: true,
            reps: true,
            holdTime: true,
            speed: true,
          },
        },
      },
    })

    const userIds = [
      ...new Set(
        patients
          .map((patient) => patient.userId)
          .filter((userId): userId is string => Boolean(userId)),
      ),
    ]

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    })

    const userNamesById = users.reduce<Record<string, string | null>>(
      (acc, user) => {
        acc[user.id] = user.name
        return acc
      },
      {},
    )

    const report = buildEffectivenessReport({
      patients,
      sessions: sessions.map((session) => ({
        patientId: session.patientId,
        createdAt: session.createdAt.toISOString(),
        completedAt: session.completedAt!.toISOString(),
        sessionData: session.sessionData,
        sessionExercises: session.sessionExercise,
      })),
      userNamesById,
      from: toISODate(from),
      to: toISODate(to),
    })

    return {
      from: toISODate(from),
      to: toISODate(to),
      ...report,
      byUser: report.byUser.map((user) => ({
        ...user,
        userId: user.userId === UNKNOWN_OWNER_ID ? null : user.userId,
      })),
    }
  })

export const dashboard = {
  getTotalUniquePatients,
  getUniquePatientsPerPhysio,
  getSessionsPerPatient,
  getTotalPatientSessions,
  getPatientSessionsPerDatePerUser,
  getEffectivenessReport,
}
