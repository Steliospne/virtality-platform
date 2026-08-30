import { createRandomStringGenerator } from '../primitives/random.ts'

export const TRIAL_REDEEM_CODE_PREFIX = 'GO-'
export const TRIAL_REDEEM_CODE_BODY_LENGTH = 10
export const DEFAULT_TRIAL_REDEEM_DAYS = 14
/** Unused codes expire one week after creation (derived; not a stored status). */
export const TRIAL_REDEEM_CODE_TTL_MS = 7 * 24 * 60 * 60 * 1000

export const TRIAL_REDEEM_CODE_PATTERN = new RegExp(
  `^${TRIAL_REDEEM_CODE_PREFIX}[A-Z0-9]{${TRIAL_REDEEM_CODE_BODY_LENGTH}}$`,
  'i',
)

export type TrialRedeemStoredStatus = 'unused' | 'redeemed' | 'already_entitled'

export const TRIAL_REDEEM_DISPLAY_STATUSES = [
  'unused',
  'expired',
  'redeemed',
  'already_entitled',
] as const

export type TrialRedeemDisplayStatus =
  (typeof TRIAL_REDEEM_DISPLAY_STATUSES)[number]

export const TRIAL_REDEEM_DISPLAY_STATUS_LABELS: Record<
  TrialRedeemDisplayStatus,
  string
> = {
  unused: 'Unused',
  expired: 'Expired',
  redeemed: 'Redeemed',
  already_entitled: 'Already entitled',
}

export type TrialRedeemCodeRecord = {
  id: number
  code: string
  status: TrialRedeemStoredStatus
  trialDays: number
  note: string | null
  createdAt: Date
  usedAt: Date | null
  usedBy: string | null
}

export type TrialRedeemCodeListItem = TrialRedeemCodeRecord & {
  displayStatus: TrialRedeemDisplayStatus
}

export type TrialRedeemCodeStore = {
  findByCode: (code: string) => Promise<TrialRedeemCodeRecord | null>
  findById: (id: number) => Promise<TrialRedeemCodeRecord | null>
  create: (data: {
    code: string
    status: TrialRedeemStoredStatus
    trialDays: number
    note: string | null
    createdAt: Date
    usedAt: null
    usedBy: null
  }) => Promise<TrialRedeemCodeRecord>
  listAll: () => Promise<TrialRedeemCodeRecord[]>
  deleteById: (id: number) => Promise<void>
}

export class TrialRedeemCodeValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TrialRedeemCodeValidationError'
  }
}

export class TrialRedeemCodeNotFoundError extends Error {
  constructor(id: number) {
    super(`Access Code ${id} was not found.`)
    this.name = 'TrialRedeemCodeNotFoundError'
  }
}

export class TrialRedeemCodeNotSendableError extends Error {
  constructor(id: number, displayStatus: TrialRedeemDisplayStatus) {
    super(
      `Access Code ${id} cannot be emailed while status is ${displayStatus}.`,
    )
    this.name = 'TrialRedeemCodeNotSendableError'
  }
}

type TrialRedeemRuntime = {
  now?: () => Date
  generateCode?: () => string
}

export type TrialRedeemEmailDelivery = {
  recipientEmail: string
  code: string
  trialDays: number
}

export type SendTrialRedeemCodeEmailInput = {
  id: number
  recipientEmail: string
}

export type SendTrialRedeemCodeEmailRuntime = TrialRedeemRuntime & {
  deliver: (payload: TrialRedeemEmailDelivery) => Promise<void>
}

export async function sendTrialRedeemCodeEmail(
  store: TrialRedeemCodeStore,
  input: SendTrialRedeemCodeEmailInput,
  runtime: SendTrialRedeemCodeEmailRuntime,
): Promise<TrialRedeemEmailDelivery> {
  const now = runtime.now?.() ?? new Date()
  const existing = await store.findById(input.id)
  if (!existing) {
    throw new TrialRedeemCodeNotFoundError(input.id)
  }

  const displayStatus = getTrialRedeemDisplayStatus(existing, now)
  if (displayStatus !== 'unused') {
    throw new TrialRedeemCodeNotSendableError(input.id, displayStatus)
  }

  const recipientEmail = input.recipientEmail.trim()
  if (!recipientEmail) {
    throw new TrialRedeemCodeValidationError('recipientEmail is required')
  }

  const payload: TrialRedeemEmailDelivery = {
    recipientEmail,
    code: existing.code,
    trialDays: existing.trialDays,
  }

  await runtime.deliver(payload)
  return payload
}

const randomBody = createRandomStringGenerator('A-Z', '0-9')

export function generateTrialRedeemCode(
  generateBody: () => string = () => randomBody(TRIAL_REDEEM_CODE_BODY_LENGTH),
): string {
  const body = generateBody().toUpperCase()
  if (body.length !== TRIAL_REDEEM_CODE_BODY_LENGTH) {
    throw new Error(
      `Access Code body must be ${TRIAL_REDEEM_CODE_BODY_LENGTH} characters`,
    )
  }
  return `${TRIAL_REDEEM_CODE_PREFIX}${body}`
}

export function getTrialRedeemDisplayStatus(
  record: Pick<TrialRedeemCodeRecord, 'status' | 'createdAt'>,
  now: Date = new Date(),
): TrialRedeemDisplayStatus {
  switch (record.status) {
    case 'redeemed':
    case 'already_entitled':
      return record.status
    case 'unused': {
      const expiresAt = record.createdAt.getTime() + TRIAL_REDEEM_CODE_TTL_MS
      if (now.getTime() >= expiresAt) return 'expired'
      return 'unused'
    }
  }
}

export type CreateTrialRedeemCodeInput = {
  trialDays?: number
  note?: string | null
}

async function generateUniqueTrialRedeemCode(
  store: TrialRedeemCodeStore,
  generateCode: () => string,
): Promise<string> {
  const maxAttempts = 100
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateCode()
    const existing = await store.findByCode(code)
    if (!existing) return code
  }
  throw new Error('Failed to generate unique Access Code')
}

export async function createTrialRedeemCode(
  store: TrialRedeemCodeStore,
  input: CreateTrialRedeemCodeInput = {},
  runtime: TrialRedeemRuntime = {},
): Promise<TrialRedeemCodeRecord> {
  const now = runtime.now?.() ?? new Date()
  const trialDays = input.trialDays ?? DEFAULT_TRIAL_REDEEM_DAYS
  if (!Number.isInteger(trialDays) || trialDays < 1) {
    throw new TrialRedeemCodeValidationError(
      'trialDays must be a positive integer',
    )
  }

  const trimmedNote = input.note?.trim()
  const note = trimmedNote ? trimmedNote : null

  const code = await generateUniqueTrialRedeemCode(
    store,
    runtime.generateCode ?? generateTrialRedeemCode,
  )

  return store.create({
    code,
    status: 'unused',
    trialDays,
    note,
    createdAt: now,
    usedAt: null,
    usedBy: null,
  })
}

export type ListTrialRedeemCodesOptions = TrialRedeemRuntime & {
  displayStatuses?: TrialRedeemDisplayStatus[]
}

export async function listTrialRedeemCodes(
  store: TrialRedeemCodeStore,
  options: ListTrialRedeemCodesOptions = {},
): Promise<TrialRedeemCodeListItem[]> {
  const now = options.now?.() ?? new Date()
  const rows = await store.listAll()
  const listed = rows.map((row) => ({
    ...row,
    displayStatus: getTrialRedeemDisplayStatus(row, now),
  }))

  if (!options.displayStatuses || options.displayStatuses.length === 0) {
    return listed
  }

  const allowed = new Set(options.displayStatuses)
  return listed.filter((row) => allowed.has(row.displayStatus))
}

export async function deleteTrialRedeemCode(
  store: TrialRedeemCodeStore,
  id: number,
): Promise<void> {
  const existing = await store.findById(id)
  if (!existing) {
    throw new TrialRedeemCodeNotFoundError(id)
  }
  await store.deleteById(id)
}
