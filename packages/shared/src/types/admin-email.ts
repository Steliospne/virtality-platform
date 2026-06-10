import { z } from 'zod'

const blockIdSchema = z.string().min(1)

const emailHeadingBlockSchema = z.object({
  type: z.literal('heading'),
  id: blockIdSchema,
  text: z.string(),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(2),
})

const emailParagraphBlockSchema = z.object({
  type: z.literal('paragraph'),
  id: blockIdSchema,
  text: z.string(),
})

const emailImageBlockSchema = z.object({
  type: z.literal('image'),
  id: blockIdSchema,
  objectKey: z.string(),
  alt: z.string(),
})

const emailButtonBlockSchema = z.object({
  type: z.literal('button'),
  id: blockIdSchema,
  label: z.string(),
  href: z.string(),
})

const emailListBlockSchema = z.object({
  type: z.literal('list'),
  id: blockIdSchema,
  items: z.array(z.string()),
  ordered: z.boolean().default(false),
})

const emailCardBlockSchema = z.object({
  type: z.literal('card'),
  id: blockIdSchema,
  heading: z.string().optional(),
  body: z.string().optional(),
  imageObjectKey: z.string().optional(),
  imageAlt: z.string().optional(),
  buttonLabel: z.string().optional(),
  buttonHref: z.string().optional(),
})

const emailDividerBlockSchema = z.object({
  type: z.literal('divider'),
  id: blockIdSchema,
})

export const emailBodyBlockSchema = z.discriminatedUnion('type', [
  emailHeadingBlockSchema,
  emailParagraphBlockSchema,
  emailImageBlockSchema,
  emailButtonBlockSchema,
  emailListBlockSchema,
  emailCardBlockSchema,
  emailDividerBlockSchema,
])

export const emailBodyBlocksSchema = z.array(emailBodyBlockSchema)

export type EmailHeadingBlock = z.infer<typeof emailHeadingBlockSchema>
export type EmailParagraphBlock = z.infer<typeof emailParagraphBlockSchema>
export type EmailImageBlock = z.infer<typeof emailImageBlockSchema>
export type EmailButtonBlock = z.infer<typeof emailButtonBlockSchema>
export type EmailListBlock = z.infer<typeof emailListBlockSchema>
export type EmailCardBlock = z.infer<typeof emailCardBlockSchema>
export type EmailDividerBlock = z.infer<typeof emailDividerBlockSchema>
export type EmailBodyBlock = z.infer<typeof emailBodyBlockSchema>

export const MAX_EMAIL_RECIPIENTS = 50
