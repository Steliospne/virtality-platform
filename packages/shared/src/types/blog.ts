import { z } from 'zod'

export const BLOG_TITLE_MAX_LENGTH = 200
export const BLOG_EXCERPT_MAX_LENGTH = 500
export const BLOG_SLUG_MAX_LENGTH = 120
export const BLOG_PARAGRAPH_MAX_LENGTH = 10_000
export const BLOG_HEADING_MAX_LENGTH = 200
export const BLOG_IMAGE_ALT_MAX_LENGTH = 200
export const BLOG_CAPTION_MAX_LENGTH = 300
export const BLOG_UPLOAD_BASE_PREFIX = 'marketing/blogs'

export const blogPostStatusSchema = z.enum(['draft', 'published', 'archived'])
export type BlogPostStatus = z.infer<typeof blogPostStatusSchema>

export const paragraphBlockSchema = z.object({
  kind: z.literal('paragraph'),
  text: z.string(),
})

export const headingBlockSchema = z.object({
  kind: z.literal('heading'),
  level: z.union([z.literal(2), z.literal(3)]),
  text: z.string(),
})

export const imageBlockSchema = z.object({
  kind: z.literal('image'),
  src: z.string(),
  alt: z.string(),
  caption: z.string().optional(),
})

export const videoBlockSchema = z.object({
  kind: z.literal('video'),
  source: z.enum(['cdn', 'youtube']),
  url: z.string(),
  caption: z.string().optional(),
})

export const bodyBlockSchema = z.discriminatedUnion('kind', [
  paragraphBlockSchema,
  headingBlockSchema,
  imageBlockSchema,
  videoBlockSchema,
])

export const bodyBlocksSchema = z.array(bodyBlockSchema)

export type ParagraphBlock = z.infer<typeof paragraphBlockSchema>
export type HeadingBlock = z.infer<typeof headingBlockSchema>
export type ImageBlock = z.infer<typeof imageBlockSchema>
export type VideoBlock = z.infer<typeof videoBlockSchema>
export type BodyBlock = z.infer<typeof bodyBlockSchema>

export const blogAuthorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.string().optional(),
  image: z.string().optional(),
})

export type BlogAuthor = z.infer<typeof blogAuthorSchema>

export const blogPostContentSchema = z.object({
  slug: z.string(),
  title: z.string(),
  excerpt: z.string(),
  cover: z.string(),
  coverFocusY: z.number().min(0).max(100).optional(),
  authorId: z.string().min(1),
  publishedAt: z.string(),
  featured: z.boolean(),
  body: bodyBlocksSchema,
})

export type BlogPostContent = z.infer<typeof blogPostContentSchema>

export type BlogResolvedPost = BlogPostContent & {
  author: BlogAuthor
}

export const listBlogPostsInputSchema = z.object({
  status: blogPostStatusSchema.optional(),
})

export type ListBlogPostsInput = z.infer<typeof listBlogPostsInputSchema>

export const getBlogPostInputSchema = z.object({
  id: z.string().min(1),
})

export type GetBlogPostInput = z.infer<typeof getBlogPostInputSchema>

export const getBlogPostBySlugInputSchema = z.object({
  slug: z.string().min(1),
})

export type GetBlogPostBySlugInput = z.infer<
  typeof getBlogPostBySlugInputSchema
>

export const createBlogDraftInputSchema = z.object({}).strict()

export type CreateBlogDraftInput = z.infer<typeof createBlogDraftInputSchema>

export const autosaveBlogPostInputSchema = z.object({
  id: z.string().min(1),
  expectedVersion: z.number().int().positive(),
  force: z.boolean().optional(),
  slug: z.string().optional(),
  title: z.string().optional(),
  excerpt: z.string().optional(),
  cover: z.string().optional(),
  coverFocusY: z.number().min(0).max(100).nullable().optional(),
  authorId: z.string().min(1).optional(),
  publishedAt: z.string().nullable().optional(),
  featured: z.boolean().optional(),
  body: bodyBlocksSchema.optional(),
})

export type AutosaveBlogPostInput = z.infer<typeof autosaveBlogPostInputSchema>

export const blogPostActionInputSchema = z.object({
  id: z.string().min(1),
  expectedVersion: z.number().int().positive(),
})

export type BlogPostActionInput = z.infer<typeof blogPostActionInputSchema>

export const setBlogPostFeaturedInputSchema = blogPostActionInputSchema.extend({
  featured: z.boolean(),
})

export type SetBlogPostFeaturedInput = z.infer<
  typeof setBlogPostFeaturedInputSchema
>

export type BlogPostAdminListItem = {
  id: string
  status: BlogPostStatus
  slug: string
  title: string
  authorId: string
  publishedAt: string | null
  featured: boolean
  slugLocked: boolean
  hasUnpublishedChanges: boolean
  version: number
  updatedAt: string
}

export type BlogPostAdminDetail = BlogPostAdminListItem & {
  excerpt: string
  cover: string
  coverFocusY: number | null
  body: BodyBlock[]
  author: BlogAuthor
}
