import { describe, expect, it, vi } from 'vitest'
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
  }>
}) {
  const users = input.users ?? []
  const subscriptions = input.subscriptions ?? []

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
  }
}

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
    expect(profile?.auditHistory).toEqual([])
  })
})
