import { describe, expect, it, vi } from 'vitest'
import { assertAdminRole } from '../middleware/admin.ts'
import {
  getAdminCustomerProfile,
  listAdminCustomers,
} from './admin-customer-service.ts'

const NOW = new Date('2026-08-10T12:00:00.000Z')

function createPrismaMock(input: {
  users?: Array<{
    id: string
    name: string
    email: string
    role?: string | null
    stripeCustomerId?: string | null
    createdAt?: Date
    deletedAt?: Date | null
  }>
  subscriptions?: Array<{
    id: string
    plan: string
    referenceId: string
    status: string
    stripeCustomerId?: string | null
    stripeSubscriptionId?: string | null
    trialEnd?: Date | null
    periodEnd?: Date | null
    endedAt?: Date | null
    canceledAt?: Date | null
    billingInterval?: string | null
    periodStart?: Date | null
    cancelAtPeriodEnd?: boolean | null
    stripeScheduleId?: string | null
  }>
  trialGrants?: Array<{
    id: string
    userId: string
    status: string
    trialStart?: Date | null
    trialEnd?: Date | null
    createdAt?: Date
  }>
}) {
  const users = input.users ?? []
  const subscriptions = input.subscriptions ?? []
  const trialGrants = input.trialGrants ?? []

  return {
    user: {
      findMany: vi.fn(async ({ where }: { where: { deletedAt: null } }) =>
        users.filter((user) => user.deletedAt == null),
      ),
      findFirst: vi.fn(
        async ({ where }: { where: { id: string; deletedAt: null } }) =>
          users.find(
            (user) => user.id === where.id && user.deletedAt == null,
          ) ?? null,
      ),
    },
    subscription: {
      findMany: vi.fn(async (args: { where: unknown }) => {
        const where = args.where as
          | { referenceId: string }
          | { referenceId: { in: string[] } }

        if ('referenceId' in where && typeof where.referenceId === 'string') {
          return subscriptions.filter(
            (subscription) => subscription.referenceId === where.referenceId,
          )
        }

        if (
          'referenceId' in where &&
          where.referenceId &&
          typeof where.referenceId === 'object' &&
          'in' in where.referenceId
        ) {
          const referenceIds = where.referenceId.in
          return subscriptions.filter((subscription) =>
            referenceIds.includes(subscription.referenceId),
          )
        }

        return subscriptions
      }),
    },
    adminCustomerAudit: {
      findMany: vi.fn(async () => []),
    },
    trialGrant: {
      findFirst: vi.fn(
        async (args: {
          where: {
            userId: string
            status?: { in: string[] }
          }
          orderBy: { createdAt: 'desc' }
        }) => {
          const matches = trialGrants.filter(
            (grant) => grant.userId === args.where.userId,
          )
          const filtered = args.where.status?.in
            ? matches.filter((grant) =>
                args.where.status!.in.includes(grant.status),
              )
            : matches

          return (
            filtered.sort(
              (left, right) =>
                (right.createdAt?.getTime() ?? 0) -
                (left.createdAt?.getTime() ?? 0),
            )[0] ?? null
          )
        },
      ),
    },
  }
}

describe('admin customer authorization', () => {
  it('rejects non-admin roles for privileged customer procedures', () => {
    expect(() => assertAdminRole('user')).toThrow()
    expect(() => assertAdminRole('tester')).toThrow()
    expect(() => assertAdminRole(null)).toThrow()
    expect(() => assertAdminRole('admin')).not.toThrow()
  })
})

describe('listAdminCustomers', () => {
  it('includes non-deleted users without Stripe customers or subscriptions', async () => {
    const prisma = createPrismaMock({
      users: [
        {
          id: 'user_none',
          name: 'No Billing',
          email: 'nobilling@example.com',
          role: 'user',
          stripeCustomerId: null,
          createdAt: NOW,
        },
      ],
    })

    const customers = await listAdminCustomers(prisma as never, { now: NOW })

    expect(customers).toEqual([
      expect.objectContaining({
        userId: 'user_none',
        email: 'nobilling@example.com',
        accessStatus: 'blocked',
        billingStatus: 'absent',
        stripeCustomerId: null,
        primarySubscriptionId: null,
      }),
    ])
  })

  it('derives separate access and billing status from the primary subscription', async () => {
    const prisma = createPrismaMock({
      users: [
        {
          id: 'user_trial',
          name: 'Trial User',
          email: 'trial@example.com',
          createdAt: NOW,
        },
      ],
      subscriptions: [
        {
          id: 'sub_free',
          plan: 'free',
          referenceId: 'user_trial',
          status: 'trialing',
          trialEnd: new Date('2026-08-20T12:00:00.000Z'),
          periodEnd: null,
          endedAt: null,
          canceledAt: null,
        },
      ],
    })

    const customers = await listAdminCustomers(prisma as never, { now: NOW })

    expect(customers[0]).toMatchObject({
      accessStatus: 'trialing',
      billingStatus: 'trialing',
      primarySubscriptionId: 'sub_free',
    })
  })
})

describe('getAdminCustomerProfile', () => {
  it('returns subscription history and Stripe links for a customer profile', async () => {
    const prisma = createPrismaMock({
      users: [
        {
          id: 'user_1',
          name: 'Profile User',
          email: 'profile@example.com',
          stripeCustomerId: 'cus_123',
          createdAt: NOW,
        },
      ],
      subscriptions: [
        {
          id: 'sub_old',
          plan: 'pro',
          referenceId: 'user_1',
          status: 'canceled',
          stripeCustomerId: 'cus_123',
          stripeSubscriptionId: 'sub_old',
          periodEnd: new Date('2026-07-01T12:00:00.000Z'),
          endedAt: new Date('2026-07-01T12:00:00.000Z'),
          canceledAt: new Date('2026-07-01T12:00:00.000Z'),
        },
        {
          id: 'sub_live',
          plan: 'free',
          referenceId: 'user_1',
          status: 'trialing',
          stripeCustomerId: 'cus_123',
          stripeSubscriptionId: 'sub_live',
          trialEnd: new Date('2026-08-20T12:00:00.000Z'),
          periodEnd: null,
          endedAt: null,
          canceledAt: null,
        },
      ],
    })

    const profile = await getAdminCustomerProfile(prisma as never, {
      userId: 'user_1',
      stripeMode: 'test',
      now: NOW,
    })

    expect(profile).toMatchObject({
      userId: 'user_1',
      accessStatus: 'trialing',
      billingStatus: 'trialing',
      stripeLinks: {
        customerUrl: 'https://dashboard.stripe.com/test/customers/cus_123',
        primarySubscriptionUrl:
          'https://dashboard.stripe.com/test/subscriptions/sub_live',
      },
      entitlement: {
        entitled: true,
        canLaunchVr: true,
      },
    })
    expect(profile?.subscriptionHistory.map((row) => row.id)).toEqual([
      'sub_live',
      'sub_old',
    ])
    expect(profile?.hasPendingCyclePlanChange).toBe(false)
    expect(profile?.auditHistory).toEqual([])
  })

  it('flags hasPendingCyclePlanChange when live Pro has a Stripe schedule', async () => {
    const prisma = createPrismaMock({
      users: [
        {
          id: 'user_paid',
          name: 'Paid User',
          email: 'paid@example.com',
          stripeCustomerId: 'cus_paid',
          createdAt: NOW,
        },
      ],
      subscriptions: [
        {
          id: 'sub_pro',
          plan: 'pro',
          referenceId: 'user_paid',
          status: 'active',
          stripeCustomerId: 'cus_paid',
          stripeSubscriptionId: 'sub_pro',
          billingInterval: 'month',
          periodEnd: new Date('2026-09-10T12:00:00.000Z'),
          cancelAtPeriodEnd: false,
          stripeScheduleId: 'sub_sched_1',
        },
      ],
    })

    const profile = await getAdminCustomerProfile(prisma as never, {
      userId: 'user_paid',
      stripeMode: 'test',
      now: NOW,
    })

    expect(profile?.hasPendingCyclePlanChange).toBe(true)
    expect(profile?.subscriptionHistory[0]?.stripeScheduleId).toBe(
      'sub_sched_1',
    )
  })

  it('includes owned trial grant entitlement when no Stripe subscription exists', async () => {
    const prisma = createPrismaMock({
      users: [
        {
          id: 'user_grant',
          name: 'Grant User',
          email: 'grant@example.com',
          createdAt: NOW,
        },
      ],
      trialGrants: [
        {
          id: 'grant_1',
          userId: 'user_grant',
          status: 'active',
          trialStart: NOW,
          trialEnd: new Date('2026-08-20T12:00:00.000Z'),
          createdAt: new Date('2026-08-01T12:00:00.000Z'),
        },
      ],
    })

    const profile = await getAdminCustomerProfile(prisma as never, {
      userId: 'user_grant',
      stripeMode: 'test',
      now: NOW,
    })

    expect(profile?.trialGrant).toMatchObject({
      status: 'active',
      entitled: true,
    })
    expect(profile?.entitlement).toMatchObject({
      entitled: true,
      canLaunchVr: true,
    })
  })
})
