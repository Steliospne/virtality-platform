import { describe, expect, it, vi } from 'vitest'

vi.mock('@virtality/db', () => ({
  prisma: {},
}))

import { ensureLiveStripeCustomerId } from './ensure-live-stripe-customer.ts'

const USER = {
  id: 'user_1',
  email: 'clinician@example.test',
  name: 'Clinician',
  stripeCustomerId: 'cus_stale' as string | null,
}

function createPrismaMock() {
  return {
    user: {
      update: vi.fn(async () => ({})),
    },
  }
}

function createStripeMock(input: {
  retrieve?: () => Promise<unknown>
  listData?: Array<{ id: string; metadata?: Record<string, string> }>
  createdId?: string
}) {
  return {
    customers: {
      retrieve: vi.fn(
        input.retrieve ??
          (async () => {
            throw { code: 'resource_missing' }
          }),
      ),
      list: vi.fn(async () => ({ data: input.listData ?? [] })),
      create: vi.fn(async () => ({ id: input.createdId ?? 'cus_new' })),
    },
  }
}

describe('ensureLiveStripeCustomerId', () => {
  it('keeps a stored customer that still exists in Stripe', async () => {
    const prisma = createPrismaMock()
    const stripeClient = createStripeMock({
      retrieve: async () => ({ id: 'cus_stale', deleted: false }),
    })

    const customerId = await ensureLiveStripeCustomerId({
      stripeClient: stripeClient as never,
      prisma: prisma as never,
      user: USER,
    })

    expect(customerId).toBe('cus_stale')
    expect(stripeClient.customers.list).not.toHaveBeenCalled()
    expect(stripeClient.customers.create).not.toHaveBeenCalled()
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it('links an existing Stripe customer with the same email when the stored id is gone', async () => {
    const prisma = createPrismaMock()
    const stripeClient = createStripeMock({
      listData: [{ id: 'cus_email' }],
    })

    const customerId = await ensureLiveStripeCustomerId({
      stripeClient: stripeClient as never,
      prisma: prisma as never,
      user: USER,
    })

    expect(customerId).toBe('cus_email')
    expect(stripeClient.customers.create).not.toHaveBeenCalled()
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: USER.id },
      data: { stripeCustomerId: 'cus_email' },
    })
  })

  it('creates a Stripe customer and stores the id when none exists for the email', async () => {
    const prisma = createPrismaMock()
    const stripeClient = createStripeMock({ createdId: 'cus_created' })

    const customerId = await ensureLiveStripeCustomerId({
      stripeClient: stripeClient as never,
      prisma: prisma as never,
      user: { ...USER, stripeCustomerId: null },
    })

    expect(customerId).toBe('cus_created')
    expect(stripeClient.customers.retrieve).not.toHaveBeenCalled()
    expect(stripeClient.customers.create).toHaveBeenCalledWith({
      email: USER.email,
      name: USER.name,
      metadata: { userId: USER.id, customerType: 'user' },
    })
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: USER.id },
      data: { stripeCustomerId: 'cus_created' },
    })
  })

  it('treats a deleted stored customer as missing and creates when email has no match', async () => {
    const prisma = createPrismaMock()
    const stripeClient = createStripeMock({
      retrieve: async () => ({ id: 'cus_stale', deleted: true }),
      createdId: 'cus_created',
    })

    const customerId = await ensureLiveStripeCustomerId({
      stripeClient: stripeClient as never,
      prisma: prisma as never,
      user: USER,
    })

    expect(customerId).toBe('cus_created')
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: USER.id },
      data: { stripeCustomerId: 'cus_created' },
    })
  })

  it('skips organization Stripe customers when matching by email', async () => {
    const prisma = createPrismaMock()
    const stripeClient = createStripeMock({
      listData: [
        { id: 'cus_org', metadata: { customerType: 'organization' } },
        { id: 'cus_user' },
      ],
    })

    const customerId = await ensureLiveStripeCustomerId({
      stripeClient: stripeClient as never,
      prisma: prisma as never,
      user: USER,
    })

    expect(customerId).toBe('cus_user')
  })
})
