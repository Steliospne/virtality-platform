import { ORPCError } from '@orpc/server'
import { Prisma, type PrismaClient } from '@virtality/db'
import {
  autosaveBlogPostInputSchema,
  blogPostActionInputSchema,
  createBlogDraftInputSchema,
  getBlogPostBySlugInputSchema,
  getBlogPostInputSchema,
  listBlogPostsInputSchema,
  setBlogPostFeaturedInputSchema,
  type BlogPostContent,
  type BodyBlock,
} from '@virtality/shared/types'
import {
  archiveBlogPost,
  autosaveBlogPost,
  blogCatalogSeedAuthors,
  blogCatalogSeedPosts,
  BlogAuthorNotFoundError,
  BlogConflictError,
  BlogNotFoundError,
  BlogValidationError,
  createBlogDraft,
  discardBlogPostChanges,
  generateUUID,
  getBlogPostAdmin,
  getPublishedBlogPostBySlug,
  listBlogAuthors,
  listBlogPostsAdmin,
  listPublishedBlogPosts,
  publishBlogPost,
  restoreBlogPost,
  seedMarketingBlogCatalogIfEmpty,
  setBlogPostFeatured,
  unpublishBlogPost,
  type BlogPostRecord,
  type BlogStore,
} from '@virtality/shared/utils'
import { authed } from '../middleware/auth.ts'
import { base, bustWebsiteMarketingCache } from '../context.ts'

function parseBody(value: Prisma.JsonValue): BodyBlock[] {
  return value as BodyBlock[]
}

function parseSnapshot(value: Prisma.JsonValue | null): BlogPostContent | null {
  if (value === null) {
    return null
  }
  return value as BlogPostContent
}

function mapPostRecord(row: {
  id: string
  status: BlogPostRecord['status']
  slug: string
  title: string
  excerpt: string
  cover: string
  coverFocusY: number | null
  authorId: string
  publishedAt: string | null
  featured: boolean
  body: Prisma.JsonValue
  publishedSnapshot: Prisma.JsonValue | null
  slugLocked: boolean
  version: number
  createdAt: Date
  updatedAt: Date
}): BlogPostRecord {
  return {
    id: row.id,
    status: row.status,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    cover: row.cover,
    coverFocusY: row.coverFocusY,
    authorId: row.authorId,
    publishedAt: row.publishedAt,
    featured: row.featured,
    body: parseBody(row.body),
    publishedSnapshot: parseSnapshot(row.publishedSnapshot),
    slugLocked: row.slugLocked,
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function createPrismaBlogStore(prisma: PrismaClient): BlogStore {
  return {
    listAuthors: () => prisma.marketingBlogAuthor.findMany(),
    findAuthorById: (id) =>
      prisma.marketingBlogAuthor.findUnique({ where: { id } }),
    listPosts: async () => {
      const rows = await prisma.marketingBlogPost.findMany()
      return rows.map(mapPostRecord)
    },
    findPostById: async (id) => {
      const row = await prisma.marketingBlogPost.findUnique({ where: { id } })
      return row ? mapPostRecord(row) : null
    },
    findPostBySlug: async (slug) => {
      const row = await prisma.marketingBlogPost.findUnique({ where: { slug } })
      return row ? mapPostRecord(row) : null
    },
    createPost: async (data) => {
      const row = await prisma.marketingBlogPost.create({
        data: {
          id: data.id,
          status: data.status,
          slug: data.slug,
          title: data.title,
          excerpt: data.excerpt,
          cover: data.cover,
          coverFocusY: data.coverFocusY,
          authorId: data.authorId,
          publishedAt: data.publishedAt,
          featured: data.featured,
          body: data.body as Prisma.InputJsonValue,
          publishedSnapshot:
            data.publishedSnapshot === null
              ? Prisma.JsonNull
              : (data.publishedSnapshot as Prisma.InputJsonValue),
          slugLocked: data.slugLocked,
          version: data.version,
        },
      })
      return mapPostRecord(row)
    },
    updatePost: async (id, data) => {
      const row = await prisma.marketingBlogPost.update({
        where: { id },
        data: {
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.slug !== undefined ? { slug: data.slug } : {}),
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.excerpt !== undefined ? { excerpt: data.excerpt } : {}),
          ...(data.cover !== undefined ? { cover: data.cover } : {}),
          ...(data.coverFocusY !== undefined
            ? { coverFocusY: data.coverFocusY }
            : {}),
          ...(data.authorId !== undefined ? { authorId: data.authorId } : {}),
          ...(data.publishedAt !== undefined
            ? { publishedAt: data.publishedAt }
            : {}),
          ...(data.featured !== undefined ? { featured: data.featured } : {}),
          ...(data.body !== undefined
            ? { body: data.body as Prisma.InputJsonValue }
            : {}),
          ...(data.publishedSnapshot !== undefined
            ? {
                publishedSnapshot:
                  data.publishedSnapshot === null
                    ? Prisma.JsonNull
                    : (data.publishedSnapshot as Prisma.InputJsonValue),
              }
            : {}),
          ...(data.slugLocked !== undefined
            ? { slugLocked: data.slugLocked }
            : {}),
          ...(data.version !== undefined ? { version: data.version } : {}),
        },
      })
      return mapPostRecord(row)
    },
    clearFeaturedExcept: async (excludeId) => {
      await prisma.marketingBlogPost.updateMany({
        where: {
          featured: true,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        data: { featured: false },
      })

      const published = await prisma.marketingBlogPost.findMany({
        where: {
          status: 'published',
          publishedSnapshot: { not: Prisma.DbNull },
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
      })

      for (const row of published) {
        const snapshot = parseSnapshot(row.publishedSnapshot)
        if (!snapshot?.featured) {
          continue
        }
        await prisma.marketingBlogPost.update({
          where: { id: row.id },
          data: {
            featured: false,
            publishedSnapshot: {
              ...snapshot,
              featured: false,
            } as Prisma.InputJsonValue,
          },
        })
      }
    },
    createAuthor: (data) => prisma.marketingBlogAuthor.create({ data }),
  }
}

function throwBlogOrpcError(error: unknown): never {
  if (error instanceof BlogValidationError) {
    throw new ORPCError('BAD_REQUEST', { message: error.message })
  }
  if (error instanceof BlogConflictError) {
    throw new ORPCError('CONFLICT', { message: error.message })
  }
  if (
    error instanceof BlogNotFoundError ||
    error instanceof BlogAuthorNotFoundError
  ) {
    throw new ORPCError('NOT_FOUND', { message: error.message })
  }
  throw error
}

async function withBlogStore<T>(
  prisma: PrismaClient,
  operation: (store: BlogStore) => Promise<T>,
): Promise<T> {
  try {
    return await operation(createPrismaBlogStore(prisma))
  } catch (error) {
    throwBlogOrpcError(error)
  }
}

async function ensureBlogSeeded(prisma: PrismaClient) {
  await withBlogStore(prisma, (store) =>
    seedMarketingBlogCatalogIfEmpty(
      store,
      {
        authors: blogCatalogSeedAuthors,
        posts: blogCatalogSeedPosts,
      },
      { generateId: generateUUID },
    ),
  )
}

async function bustBlogCache(
  context: Parameters<typeof bustWebsiteMarketingCache>[0],
) {
  await bustWebsiteMarketingCache(context, { tag: 'blog' })
}

const listPublishedProcedure = base
  .route({ path: '/blog/list-published', method: 'GET' })
  .handler(async ({ context }) => {
    await ensureBlogSeeded(context.prisma)
    return withBlogStore(context.prisma, listPublishedBlogPosts)
  })

const getPublishedBySlugProcedure = base
  .route({ path: '/blog/get-published-by-slug', method: 'GET' })
  .input(getBlogPostBySlugInputSchema)
  .handler(async ({ context, input }) => {
    await ensureBlogSeeded(context.prisma)
    return withBlogStore(context.prisma, (store) =>
      getPublishedBlogPostBySlug(store, input.slug),
    )
  })

const listAuthorsProcedure = authed
  .route({ path: '/blog/list-authors', method: 'GET' })
  .handler(async ({ context }) => {
    await ensureBlogSeeded(context.prisma)
    return withBlogStore(context.prisma, listBlogAuthors)
  })

const listProcedure = authed
  .route({ path: '/blog/list', method: 'GET' })
  .input(listBlogPostsInputSchema)
  .handler(async ({ context, input }) => {
    await ensureBlogSeeded(context.prisma)
    return withBlogStore(context.prisma, (store) =>
      listBlogPostsAdmin(store, input.status),
    )
  })

const getProcedure = authed
  .route({ path: '/blog/get', method: 'GET' })
  .input(getBlogPostInputSchema)
  .handler(async ({ context, input }) => {
    await ensureBlogSeeded(context.prisma)
    return withBlogStore(context.prisma, (store) =>
      getBlogPostAdmin(store, input.id),
    )
  })

const createDraftProcedure = authed
  .route({ path: '/blog/create-draft', method: 'POST' })
  .input(createBlogDraftInputSchema)
  .handler(async ({ context }) => {
    await ensureBlogSeeded(context.prisma)
    return withBlogStore(context.prisma, (store) =>
      createBlogDraft(store, { generateId: generateUUID }),
    )
  })

const autosaveProcedure = authed
  .route({ path: '/blog/autosave', method: 'POST' })
  .input(autosaveBlogPostInputSchema)
  .handler(async ({ context, input }) => {
    const { force, ...rest } = input
    return withBlogStore(context.prisma, (store) =>
      autosaveBlogPost(store, rest, { force }),
    )
  })

const publishProcedure = authed
  .route({ path: '/blog/publish', method: 'POST' })
  .input(blogPostActionInputSchema)
  .handler(async ({ context, input }) => {
    const result = await withBlogStore(context.prisma, (store) =>
      publishBlogPost(store, input),
    )
    await bustBlogCache(context)
    return result
  })

const unpublishProcedure = authed
  .route({ path: '/blog/unpublish', method: 'POST' })
  .input(blogPostActionInputSchema)
  .handler(async ({ context, input }) => {
    const result = await withBlogStore(context.prisma, (store) =>
      unpublishBlogPost(store, input),
    )
    await bustBlogCache(context)
    return result
  })

const discardProcedure = authed
  .route({ path: '/blog/discard-changes', method: 'POST' })
  .input(blogPostActionInputSchema)
  .handler(async ({ context, input }) => {
    return withBlogStore(context.prisma, (store) =>
      discardBlogPostChanges(store, input),
    )
  })

const archiveProcedure = authed
  .route({ path: '/blog/archive', method: 'POST' })
  .input(blogPostActionInputSchema)
  .handler(async ({ context, input }) => {
    const existing = await withBlogStore(context.prisma, (store) =>
      store.findPostById(input.id),
    )
    const result = await withBlogStore(context.prisma, (store) =>
      archiveBlogPost(store, input),
    )
    if (existing?.status === 'published') {
      await bustBlogCache(context)
    }
    return result
  })

const restoreProcedure = authed
  .route({ path: '/blog/restore', method: 'POST' })
  .input(blogPostActionInputSchema)
  .handler(async ({ context, input }) => {
    return withBlogStore(context.prisma, (store) =>
      restoreBlogPost(store, input),
    )
  })

const setFeaturedProcedure = authed
  .route({ path: '/blog/set-featured', method: 'POST' })
  .input(setBlogPostFeaturedInputSchema)
  .handler(async ({ context, input }) => {
    const result = await withBlogStore(context.prisma, (store) =>
      setBlogPostFeatured(store, input),
    )
    await bustBlogCache(context)
    return result
  })

export const blog = {
  listPublished: listPublishedProcedure,
  getPublishedBySlug: getPublishedBySlugProcedure,
  listAuthors: listAuthorsProcedure,
  list: listProcedure,
  get: getProcedure,
  createDraft: createDraftProcedure,
  autosave: autosaveProcedure,
  publish: publishProcedure,
  unpublish: unpublishProcedure,
  discardChanges: discardProcedure,
  archive: archiveProcedure,
  restore: restoreProcedure,
  setFeatured: setFeaturedProcedure,
}
