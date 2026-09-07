import { prisma } from '@virtality/db'
import type { PrismaClient } from '@virtality/db'
import type Stripe from 'stripe'

export type EnsureLiveStripeCustomerUser = {
  id: string
  email: string
  name: string | null
  stripeCustomerId: string | null
}

function isStripeResourceMissing(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'resource_missing'
  )
}

async function retrieveLiveCustomer(
  stripeClient: Stripe,
  customerId: string,
): Promise<Stripe.Customer | null> {
  try {
    const customer = await stripeClient.customers.retrieve(customerId)
    if (customer.deleted) return null
    return customer
  } catch (error) {
    if (isStripeResourceMissing(error)) return null
    throw error
  }
}

async function findCustomerByEmail(
  stripeClient: Stripe,
  email: string,
): Promise<Stripe.Customer | null> {
  const listed = await stripeClient.customers.list({
    email,
    limit: 10,
  })
  return (
    listed.data.find(
      (customer) => customer.metadata?.customerType !== 'organization',
    ) ?? null
  )
}

async function persistStripeCustomerId(
  client: PrismaClient,
  userId: string,
  stripeCustomerId: string,
): Promise<void> {
  await client.user.update({
    where: { id: userId },
    data: { stripeCustomerId },
  })
}

/**
 * Stored `stripeCustomerId` can point at a deleted customer or a customer from
 * another Stripe account. Checkout needs a live Customer: reuse the stored id
 * when Stripe still has it, otherwise match email, otherwise create.
 */
export async function ensureLiveStripeCustomerId(input: {
  stripeClient: Stripe
  prisma?: PrismaClient
  user: EnsureLiveStripeCustomerUser
}): Promise<string> {
  const client = input.prisma ?? prisma
  const { user, stripeClient } = input

  if (user.stripeCustomerId) {
    const stored = await retrieveLiveCustomer(
      stripeClient,
      user.stripeCustomerId,
    )
    if (stored) return stored.id
  }

  const byEmail = await findCustomerByEmail(stripeClient, user.email)
  if (byEmail) {
    if (byEmail.id !== user.stripeCustomerId) {
      await persistStripeCustomerId(client, user.id, byEmail.id)
    }
    return byEmail.id
  }

  const created = await stripeClient.customers.create({
    email: user.email,
    name: user.name ?? undefined,
    metadata: {
      userId: user.id,
      customerType: 'user',
    },
  })
  await persistStripeCustomerId(client, user.id, created.id)
  return created.id
}
