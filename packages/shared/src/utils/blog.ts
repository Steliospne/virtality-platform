import {
  BLOG_CAPTION_MAX_LENGTH,
  BLOG_EXCERPT_MAX_LENGTH,
  BLOG_HEADING_MAX_LENGTH,
  BLOG_IMAGE_ALT_MAX_LENGTH,
  BLOG_PARAGRAPH_MAX_LENGTH,
  BLOG_SLUG_MAX_LENGTH,
  BLOG_TITLE_MAX_LENGTH,
  type AutosaveBlogPostInput,
  type BlogAuthor,
  type BlogPostActionInput,
  type BlogPostAdminDetail,
  type BlogPostAdminListItem,
  type BlogPostContent,
  type BlogPostStatus,
  type BlogResolvedPost,
  type BodyBlock,
  type SetBlogPostFeaturedInput,
} from '../types/blog.ts'

export type BlogAuthorRecord = {
  id: string
  name: string
  role: string | null
  image: string | null
  createdAt: Date
  updatedAt: Date
}

export type BlogPostRecord = {
  id: string
  status: BlogPostStatus
  slug: string
  title: string
  excerpt: string
  cover: string
  coverFocusY: number | null
  authorId: string
  publishedAt: string | null
  featured: boolean
  body: BodyBlock[]
  publishedSnapshot: BlogPostContent | null
  slugLocked: boolean
  version: number
  createdAt: Date
  updatedAt: Date
}

export type BlogPostUpdateData = {
  status?: BlogPostStatus
  slug?: string
  title?: string
  excerpt?: string
  cover?: string
  coverFocusY?: number | null
  authorId?: string
  publishedAt?: string | null
  featured?: boolean
  body?: BodyBlock[]
  publishedSnapshot?: BlogPostContent | null
  slugLocked?: boolean
  version?: number
}

export type BlogStore = {
  listAuthors: () => Promise<BlogAuthorRecord[]>
  findAuthorById: (id: string) => Promise<BlogAuthorRecord | null>
  listPosts: () => Promise<BlogPostRecord[]>
  findPostById: (id: string) => Promise<BlogPostRecord | null>
  findPostBySlug: (slug: string) => Promise<BlogPostRecord | null>
  createPost: (data: {
    id: string
    status: BlogPostStatus
    slug: string
    title: string
    excerpt: string
    cover: string
    coverFocusY: number | null
    authorId: string
    publishedAt: string | null
    featured: boolean
    body: BodyBlock[]
    publishedSnapshot: BlogPostContent | null
    slugLocked: boolean
    version: number
  }) => Promise<BlogPostRecord>
  updatePost: (id: string, data: BlogPostUpdateData) => Promise<BlogPostRecord>
  /** Clears featured on all published posts except optional excludeId. */
  clearFeaturedExcept: (excludeId: string | null) => Promise<void>
  createAuthor: (data: {
    id: string
    name: string
    role: string | null
    image: string | null
  }) => Promise<BlogAuthorRecord>
}

export class BlogValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BlogValidationError'
  }
}

export class BlogNotFoundError extends Error {
  constructor(idOrSlug: string) {
    super(`Blog post "${idOrSlug}" was not found.`)
    this.name = 'BlogNotFoundError'
  }
}

export class BlogConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BlogConflictError'
  }
}

export class BlogAuthorNotFoundError extends Error {
  constructor(id: string) {
    super(`Blog author "${id}" was not found.`)
    this.name = 'BlogAuthorNotFoundError'
  }
}

const PUBLISHED_AT_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function mapAuthorRecord(record: BlogAuthorRecord): BlogAuthor {
  return {
    id: record.id,
    name: record.name,
    ...(record.role ? { role: record.role } : {}),
    ...(record.image ? { image: record.image } : {}),
  }
}

export function workingContentFromRecord(
  record: BlogPostRecord,
): BlogPostContent {
  return {
    slug: record.slug,
    title: record.title,
    excerpt: record.excerpt,
    cover: record.cover,
    ...(record.coverFocusY !== null ? { coverFocusY: record.coverFocusY } : {}),
    authorId: record.authorId,
    publishedAt: record.publishedAt ?? '',
    featured: record.featured,
    body: record.body,
  }
}

export function hasUnpublishedChanges(record: BlogPostRecord): boolean {
  if (record.status !== 'published' || !record.publishedSnapshot) {
    return false
  }

  return (
    JSON.stringify(workingContentFromRecord(record)) !==
    JSON.stringify(normalizeSnapshot(record.publishedSnapshot))
  )
}

function normalizeSnapshot(snapshot: BlogPostContent): BlogPostContent {
  return {
    slug: snapshot.slug,
    title: snapshot.title,
    excerpt: snapshot.excerpt,
    cover: snapshot.cover,
    ...(snapshot.coverFocusY !== undefined
      ? { coverFocusY: snapshot.coverFocusY }
      : {}),
    authorId: snapshot.authorId,
    publishedAt: snapshot.publishedAt,
    featured: snapshot.featured,
    body: snapshot.body,
  }
}

function toAdminListItem(record: BlogPostRecord): BlogPostAdminListItem {
  return {
    id: record.id,
    status: record.status,
    slug: record.slug,
    title: record.title,
    authorId: record.authorId,
    publishedAt: record.publishedAt,
    featured: record.featured,
    slugLocked: record.slugLocked,
    hasUnpublishedChanges: hasUnpublishedChanges(record),
    version: record.version,
    updatedAt: record.updatedAt.toISOString(),
  }
}

async function toAdminDetail(
  store: BlogStore,
  record: BlogPostRecord,
): Promise<BlogPostAdminDetail> {
  const author = await store.findAuthorById(record.authorId)
  if (!author) {
    throw new BlogAuthorNotFoundError(record.authorId)
  }

  return {
    ...toAdminListItem(record),
    excerpt: record.excerpt,
    cover: record.cover,
    coverFocusY: record.coverFocusY,
    body: record.body,
    author: mapAuthorRecord(author),
  }
}

export function slugifyBlogTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, BLOG_SLUG_MAX_LENGTH)
}

function assertVersion(record: BlogPostRecord, expectedVersion: number) {
  if (record.version !== expectedVersion) {
    throw new BlogConflictError(
      'This post was updated elsewhere. Reload to continue, or overwrite.',
    )
  }
}

function normalizeOptionalString(
  value: string | undefined,
): string | undefined {
  if (value === undefined) {
    return undefined
  }
  return value.trim()
}

function validateSlugShape(slug: string, { required }: { required: boolean }) {
  if (!slug) {
    if (required) {
      throw new BlogValidationError('Slug is required.')
    }
    return
  }

  if (slug.length > BLOG_SLUG_MAX_LENGTH) {
    throw new BlogValidationError(
      `Slug cannot exceed ${BLOG_SLUG_MAX_LENGTH} characters.`,
    )
  }

  if (!SLUG_PATTERN.test(slug)) {
    throw new BlogValidationError(
      'Slug must be lowercase letters, numbers, and hyphens only.',
    )
  }
}

function validateWorkingFields(
  fields: {
    title: string
    excerpt: string
    cover: string
    coverFocusY: number | null
    publishedAt: string | null
    body: BodyBlock[]
  },
  { forPublish }: { forPublish: boolean },
) {
  if (fields.title.length > BLOG_TITLE_MAX_LENGTH) {
    throw new BlogValidationError(
      `Title cannot exceed ${BLOG_TITLE_MAX_LENGTH} characters.`,
    )
  }

  if (fields.excerpt.length > BLOG_EXCERPT_MAX_LENGTH) {
    throw new BlogValidationError(
      `Excerpt cannot exceed ${BLOG_EXCERPT_MAX_LENGTH} characters.`,
    )
  }

  if (
    fields.coverFocusY !== null &&
    (fields.coverFocusY < 0 || fields.coverFocusY > 100)
  ) {
    throw new BlogValidationError('Cover focus must be between 0 and 100.')
  }

  if (fields.publishedAt !== null && fields.publishedAt !== '') {
    if (!PUBLISHED_AT_PATTERN.test(fields.publishedAt)) {
      throw new BlogValidationError('Published date must be YYYY-MM-DD.')
    }
  }

  validateBodyBlocks(fields.body, { forPublish })

  if (!forPublish) {
    return
  }

  if (!fields.title.trim()) {
    throw new BlogValidationError('Title is required to publish.')
  }

  if (!fields.excerpt.trim()) {
    throw new BlogValidationError('Excerpt is required to publish.')
  }

  if (!fields.cover.trim()) {
    throw new BlogValidationError('Cover is required to publish.')
  }

  if (!fields.publishedAt || !PUBLISHED_AT_PATTERN.test(fields.publishedAt)) {
    throw new BlogValidationError(
      'Published date is required to publish (YYYY-MM-DD).',
    )
  }

  if (fields.body.length === 0) {
    throw new BlogValidationError(
      'Body must include at least one block to publish.',
    )
  }
}

function validateBodyBlocks(
  body: BodyBlock[],
  { forPublish }: { forPublish: boolean },
) {
  for (const [index, block] of body.entries()) {
    const label = `Block ${index + 1}`

    if (block.kind === 'paragraph') {
      if (block.text.length > BLOG_PARAGRAPH_MAX_LENGTH) {
        throw new BlogValidationError(
          `${label}: paragraph cannot exceed ${BLOG_PARAGRAPH_MAX_LENGTH} characters.`,
        )
      }
      if (forPublish && !block.text.trim()) {
        throw new BlogValidationError(`${label}: paragraph cannot be empty.`)
      }
      continue
    }

    if (block.kind === 'heading') {
      if (block.text.length > BLOG_HEADING_MAX_LENGTH) {
        throw new BlogValidationError(
          `${label}: heading cannot exceed ${BLOG_HEADING_MAX_LENGTH} characters.`,
        )
      }
      if (forPublish && !block.text.trim()) {
        throw new BlogValidationError(`${label}: heading cannot be empty.`)
      }
      continue
    }

    if (block.kind === 'image') {
      if (forPublish && !block.src.trim()) {
        throw new BlogValidationError(`${label}: image source is required.`)
      }
      if (forPublish && !block.alt.trim()) {
        throw new BlogValidationError(`${label}: image alt text is required.`)
      }
      if (block.alt.length > BLOG_IMAGE_ALT_MAX_LENGTH) {
        throw new BlogValidationError(
          `${label}: alt cannot exceed ${BLOG_IMAGE_ALT_MAX_LENGTH} characters.`,
        )
      }
      if (
        block.caption !== undefined &&
        block.caption.length > BLOG_CAPTION_MAX_LENGTH
      ) {
        throw new BlogValidationError(
          `${label}: caption cannot exceed ${BLOG_CAPTION_MAX_LENGTH} characters.`,
        )
      }
      continue
    }

    if (forPublish && !block.url.trim()) {
      throw new BlogValidationError(`${label}: video URL is required.`)
    }
    if (
      block.caption !== undefined &&
      block.caption.length > BLOG_CAPTION_MAX_LENGTH
    ) {
      throw new BlogValidationError(
        `${label}: caption cannot exceed ${BLOG_CAPTION_MAX_LENGTH} characters.`,
      )
    }
  }
}

export async function listBlogAuthors(store: BlogStore): Promise<BlogAuthor[]> {
  const authors = await store.listAuthors()
  return authors.map(mapAuthorRecord)
}

export async function listBlogPostsAdmin(
  store: BlogStore,
  status?: BlogPostStatus,
): Promise<BlogPostAdminListItem[]> {
  const posts = await store.listPosts()
  return posts
    .filter((post) => (status ? post.status === status : true))
    .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())
    .map(toAdminListItem)
}

export async function getBlogPostAdmin(
  store: BlogStore,
  id: string,
): Promise<BlogPostAdminDetail> {
  const post = await store.findPostById(id)
  if (!post) {
    throw new BlogNotFoundError(id)
  }
  return toAdminDetail(store, post)
}

function todayPublishedAt(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function createBlogDraft(
  store: BlogStore,
  deps: { generateId: () => string },
): Promise<BlogPostAdminDetail> {
  const authors = await store.listAuthors()
  const defaultAuthor = authors[0]
  if (!defaultAuthor) {
    throw new BlogValidationError(
      'No blog authors are seeded. Cannot create a draft.',
    )
  }

  const id = deps.generateId()
  const slug = `untitled-${id.slice(0, 8)}`

  const created = await store.createPost({
    id,
    status: 'draft',
    slug,
    title: 'Untitled',
    excerpt: '',
    cover: '',
    coverFocusY: null,
    authorId: defaultAuthor.id,
    publishedAt: null,
    featured: false,
    body: [],
    publishedSnapshot: null,
    slugLocked: false,
    version: 1,
  })

  return toAdminDetail(store, created)
}

export async function autosaveBlogPost(
  store: BlogStore,
  input: AutosaveBlogPostInput,
  options: { force?: boolean } = {},
): Promise<BlogPostAdminDetail> {
  const existing = await store.findPostById(input.id)
  if (!existing) {
    throw new BlogNotFoundError(input.id)
  }

  if (!options.force) {
    assertVersion(existing, input.expectedVersion)
  }

  if (existing.status === 'archived') {
    throw new BlogValidationError(
      'Archived posts cannot be edited. Restore first.',
    )
  }

  const nextSlug =
    normalizeOptionalString(input.slug) !== undefined
      ? normalizeOptionalString(input.slug)!
      : existing.slug

  if (existing.slugLocked && nextSlug !== existing.slug) {
    throw new BlogValidationError(
      'Slug is locked after the first publish and cannot be changed.',
    )
  }

  validateSlugShape(nextSlug, { required: false })

  if (nextSlug && nextSlug !== existing.slug) {
    const collision = await store.findPostBySlug(nextSlug)
    if (collision && collision.id !== existing.id) {
      throw new BlogValidationError(`Slug "${nextSlug}" is already in use.`)
    }
  }

  if (input.authorId !== undefined) {
    const author = await store.findAuthorById(input.authorId)
    if (!author) {
      throw new BlogAuthorNotFoundError(input.authorId)
    }
  }

  const nextTitle =
    normalizeOptionalString(input.title) !== undefined
      ? normalizeOptionalString(input.title)!
      : existing.title
  const nextExcerpt =
    normalizeOptionalString(input.excerpt) !== undefined
      ? normalizeOptionalString(input.excerpt)!
      : existing.excerpt
  const nextCover =
    normalizeOptionalString(input.cover) !== undefined
      ? normalizeOptionalString(input.cover)!
      : existing.cover
  const nextCoverFocusY =
    input.coverFocusY !== undefined ? input.coverFocusY : existing.coverFocusY
  const nextPublishedAt =
    input.publishedAt !== undefined ? input.publishedAt : existing.publishedAt
  const nextBody = input.body !== undefined ? input.body : existing.body
  const nextFeatured =
    input.featured !== undefined ? input.featured : existing.featured
  const nextAuthorId =
    input.authorId !== undefined ? input.authorId : existing.authorId

  validateWorkingFields(
    {
      title: nextTitle,
      excerpt: nextExcerpt,
      cover: nextCover,
      coverFocusY: nextCoverFocusY,
      publishedAt: nextPublishedAt,
      body: nextBody,
    },
    { forPublish: false },
  )

  const updated = await store.updatePost(existing.id, {
    slug: nextSlug,
    title: nextTitle,
    excerpt: nextExcerpt,
    cover: nextCover,
    coverFocusY: nextCoverFocusY,
    authorId: nextAuthorId,
    publishedAt: nextPublishedAt,
    featured: nextFeatured,
    body: nextBody,
    version: existing.version + 1,
  })

  return toAdminDetail(store, updated)
}

export async function publishBlogPost(
  store: BlogStore,
  input: BlogPostActionInput,
): Promise<BlogPostAdminDetail> {
  const existing = await store.findPostById(input.id)
  if (!existing) {
    throw new BlogNotFoundError(input.id)
  }

  assertVersion(existing, input.expectedVersion)

  if (existing.status === 'archived') {
    throw new BlogValidationError(
      'Archived posts cannot be published. Restore first.',
    )
  }

  validateSlugShape(existing.slug, { required: true })

  const collision = await store.findPostBySlug(existing.slug)
  if (collision && collision.id !== existing.id) {
    throw new BlogValidationError(`Slug "${existing.slug}" is already in use.`)
  }

  const author = await store.findAuthorById(existing.authorId)
  if (!author) {
    throw new BlogAuthorNotFoundError(existing.authorId)
  }

  const publishedAt = existing.publishedAt ?? todayPublishedAt()

  validateWorkingFields(
    {
      title: existing.title,
      excerpt: existing.excerpt,
      cover: existing.cover,
      coverFocusY: existing.coverFocusY,
      publishedAt,
      body: existing.body,
    },
    { forPublish: true },
  )

  const snapshot: BlogPostContent = {
    slug: existing.slug,
    title: existing.title.trim(),
    excerpt: existing.excerpt.trim(),
    cover: existing.cover.trim(),
    ...(existing.coverFocusY !== null
      ? { coverFocusY: existing.coverFocusY }
      : {}),
    authorId: existing.authorId,
    publishedAt,
    featured: existing.featured,
    body: existing.body,
  }

  if (snapshot.featured) {
    await store.clearFeaturedExcept(existing.id)
  }

  const updated = await store.updatePost(existing.id, {
    status: 'published',
    publishedAt,
    publishedSnapshot: snapshot,
    slugLocked: true,
    featured: snapshot.featured,
    version: existing.version + 1,
  })

  return toAdminDetail(store, updated)
}

export async function unpublishBlogPost(
  store: BlogStore,
  input: BlogPostActionInput,
): Promise<BlogPostAdminDetail> {
  const existing = await store.findPostById(input.id)
  if (!existing) {
    throw new BlogNotFoundError(input.id)
  }

  assertVersion(existing, input.expectedVersion)

  if (existing.status !== 'published') {
    throw new BlogValidationError('Only published posts can be unpublished.')
  }

  const updated = await store.updatePost(existing.id, {
    status: 'draft',
    publishedSnapshot: null,
    featured: false,
    version: existing.version + 1,
  })

  return toAdminDetail(store, updated)
}

export async function discardBlogPostChanges(
  store: BlogStore,
  input: BlogPostActionInput,
): Promise<BlogPostAdminDetail> {
  const existing = await store.findPostById(input.id)
  if (!existing) {
    throw new BlogNotFoundError(input.id)
  }

  assertVersion(existing, input.expectedVersion)

  if (existing.status !== 'published' || !existing.publishedSnapshot) {
    throw new BlogValidationError(
      'Discard is only available for published posts with a snapshot.',
    )
  }

  const snapshot = normalizeSnapshot(existing.publishedSnapshot)

  const updated = await store.updatePost(existing.id, {
    slug: snapshot.slug,
    title: snapshot.title,
    excerpt: snapshot.excerpt,
    cover: snapshot.cover,
    coverFocusY: snapshot.coverFocusY ?? null,
    authorId: snapshot.authorId,
    publishedAt: snapshot.publishedAt,
    featured: snapshot.featured,
    body: snapshot.body,
    version: existing.version + 1,
  })

  return toAdminDetail(store, updated)
}

export async function archiveBlogPost(
  store: BlogStore,
  input: BlogPostActionInput,
): Promise<BlogPostAdminDetail> {
  const existing = await store.findPostById(input.id)
  if (!existing) {
    throw new BlogNotFoundError(input.id)
  }

  assertVersion(existing, input.expectedVersion)

  if (existing.status === 'archived') {
    throw new BlogValidationError('Post is already archived.')
  }

  const updated = await store.updatePost(existing.id, {
    status: 'archived',
    publishedSnapshot:
      existing.status === 'published' ? null : existing.publishedSnapshot,
    featured: false,
    version: existing.version + 1,
  })

  return toAdminDetail(store, updated)
}

export async function restoreBlogPost(
  store: BlogStore,
  input: BlogPostActionInput,
): Promise<BlogPostAdminDetail> {
  const existing = await store.findPostById(input.id)
  if (!existing) {
    throw new BlogNotFoundError(input.id)
  }

  assertVersion(existing, input.expectedVersion)

  if (existing.status !== 'archived') {
    throw new BlogValidationError('Only archived posts can be restored.')
  }

  const updated = await store.updatePost(existing.id, {
    status: 'draft',
    version: existing.version + 1,
  })

  return toAdminDetail(store, updated)
}

export async function setBlogPostFeatured(
  store: BlogStore,
  input: SetBlogPostFeaturedInput,
): Promise<BlogPostAdminDetail> {
  const existing = await store.findPostById(input.id)
  if (!existing) {
    throw new BlogNotFoundError(input.id)
  }

  assertVersion(existing, input.expectedVersion)

  if (existing.status !== 'published' || !existing.publishedSnapshot) {
    throw new BlogValidationError('Only published posts can be featured.')
  }

  if (input.featured) {
    await store.clearFeaturedExcept(existing.id)
  }

  const nextSnapshot: BlogPostContent = {
    ...normalizeSnapshot(existing.publishedSnapshot),
    featured: input.featured,
  }

  const updated = await store.updatePost(existing.id, {
    featured: input.featured,
    publishedSnapshot: nextSnapshot,
    version: existing.version + 1,
  })

  return toAdminDetail(store, updated)
}

export async function listPublishedBlogPosts(
  store: BlogStore,
): Promise<BlogResolvedPost[]> {
  const [posts, authors] = await Promise.all([
    store.listPosts(),
    store.listAuthors(),
  ])
  const authorsById = new Map(
    authors.map((author) => [author.id, mapAuthorRecord(author)]),
  )

  return posts
    .filter(
      (post) => post.status === 'published' && post.publishedSnapshot !== null,
    )
    .map((post) => {
      const snapshot = normalizeSnapshot(post.publishedSnapshot!)
      const author = authorsById.get(snapshot.authorId)
      if (!author) {
        throw new BlogAuthorNotFoundError(snapshot.authorId)
      }
      return { ...snapshot, author }
    })
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt))
}

export async function getPublishedBlogPostBySlug(
  store: BlogStore,
  slug: string,
): Promise<BlogResolvedPost | null> {
  const posts = await listPublishedBlogPosts(store)
  return posts.find((post) => post.slug === slug) ?? null
}

export async function seedMarketingBlogCatalogIfEmpty(
  store: BlogStore,
  catalog: {
    authors: BlogAuthor[]
    posts: BlogPostContent[]
  },
  deps: { generateId: () => string },
): Promise<{ seeded: boolean }> {
  const existingPosts = await store.listPosts()
  if (existingPosts.length > 0) {
    return { seeded: false }
  }

  const existingAuthors = await store.listAuthors()
  const authorIds = new Set(existingAuthors.map((author) => author.id))

  for (const author of catalog.authors) {
    if (authorIds.has(author.id)) {
      continue
    }
    await store.createAuthor({
      id: author.id,
      name: author.name,
      role: author.role ?? null,
      image: author.image ?? null,
    })
    authorIds.add(author.id)
  }

  for (const post of catalog.posts) {
    const id = deps.generateId()
    await store.createPost({
      id,
      status: 'published',
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      cover: post.cover,
      coverFocusY: post.coverFocusY ?? null,
      authorId: post.authorId,
      publishedAt: post.publishedAt,
      featured: post.featured,
      body: post.body,
      publishedSnapshot: {
        ...post,
        ...(post.coverFocusY !== undefined
          ? { coverFocusY: post.coverFocusY }
          : {}),
      },
      slugLocked: true,
      version: 1,
    })
  }

  return { seeded: true }
}
