import { describe, expect, it, vi } from 'vitest'
import type { BlogPostContent } from '../types/blog.ts'
import {
  autosaveBlogPost,
  BlogConflictError,
  BlogValidationError,
  createBlogDraft,
  discardBlogPostChanges,
  hasUnpublishedChanges,
  publishBlogPost,
  slugifyBlogTitle,
  unpublishBlogPost,
  type BlogAuthorRecord,
  type BlogPostRecord,
  type BlogPostUpdateData,
  type BlogStore,
} from './blog.ts'

const now = new Date('2026-08-12T12:00:00.000Z')

function createStore(initial?: {
  authors?: BlogAuthorRecord[]
  posts?: BlogPostRecord[]
}): BlogStore & { posts: BlogPostRecord[]; authors: BlogAuthorRecord[] } {
  const authors: BlogAuthorRecord[] = initial?.authors
    ? [...initial.authors]
    : [
        {
          id: 'virtality-team',
          name: 'Virtality',
          role: null,
          image: '/virtality_small_rounded.png',
          createdAt: now,
          updatedAt: now,
        },
      ]
  const posts: BlogPostRecord[] = initial?.posts ? [...initial.posts] : []

  return {
    authors,
    posts,
    listAuthors: vi.fn(async () => [...authors]),
    findAuthorById: vi.fn(
      async (id) => authors.find((author) => author.id === id) ?? null,
    ),
    listPosts: vi.fn(async () => [...posts]),
    findPostById: vi.fn(
      async (id) => posts.find((post) => post.id === id) ?? null,
    ),
    findPostBySlug: vi.fn(
      async (slug) => posts.find((post) => post.slug === slug) ?? null,
    ),
    createPost: vi.fn(async (data) => {
      const record: BlogPostRecord = {
        ...data,
        createdAt: now,
        updatedAt: now,
      }
      posts.push(record)
      return record
    }),
    updatePost: vi.fn(async (id, data: BlogPostUpdateData) => {
      const record = posts.find((post) => post.id === id)
      if (!record) {
        throw new Error('missing')
      }
      Object.assign(record, data, { updatedAt: now })
      return record
    }),
    clearFeaturedExcept: vi.fn(async (excludeId) => {
      for (const post of posts) {
        if (excludeId && post.id === excludeId) {
          continue
        }
        post.featured = false
        if (post.publishedSnapshot) {
          post.publishedSnapshot = {
            ...post.publishedSnapshot,
            featured: false,
          }
        }
      }
    }),
    createAuthor: vi.fn(async (data) => {
      const record: BlogAuthorRecord = {
        ...data,
        createdAt: now,
        updatedAt: now,
      }
      authors.push(record)
      return record
    }),
  }
}

function publishedRecord(
  overrides: Partial<BlogPostRecord> = {},
): BlogPostRecord {
  const snapshot: BlogPostContent = {
    slug: 'hello-world',
    title: 'Hello world',
    excerpt: 'An excerpt',
    cover: 'https://cdn.virtality.app/marketing/blogs/cover.png',
    authorId: 'virtality-team',
    publishedAt: '2026-08-01',
    featured: false,
    body: [{ kind: 'paragraph', text: 'Body copy.' }],
  }

  return {
    id: 'post-1',
    status: 'published',
    slug: snapshot.slug,
    title: snapshot.title,
    excerpt: snapshot.excerpt,
    cover: snapshot.cover,
    coverFocusY: null,
    authorId: snapshot.authorId,
    publishedAt: snapshot.publishedAt,
    featured: false,
    body: snapshot.body,
    publishedSnapshot: snapshot,
    slugLocked: true,
    version: 3,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

describe('slugifyBlogTitle', () => {
  it('builds a lowercase hyphenated slug', () => {
    expect(slugifyBlogTitle('Hello, Virtality World!')).toBe(
      'hello-virtality-world',
    )
  })
})

describe('blog publish workflow', () => {
  it('creates a draft with a default author', async () => {
    const store = createStore()
    const draft = await createBlogDraft(store, {
      generateId: () => 'draft-id-12345678',
    })
    expect(draft.status).toBe('draft')
    expect(draft.authorId).toBe('virtality-team')
    expect(draft.slug.startsWith('untitled-')).toBe(true)
  })

  it('rejects stale autosave versions', async () => {
    const store = createStore({ posts: [publishedRecord()] })
    await expect(
      autosaveBlogPost(store, {
        id: 'post-1',
        expectedVersion: 1,
        title: 'Stale',
      }),
    ).rejects.toBeInstanceOf(BlogConflictError)
  })

  it('publishes working copy into the snapshot and locks the slug', async () => {
    const store = createStore({
      posts: [
        publishedRecord({
          status: 'draft',
          publishedSnapshot: null,
          slugLocked: false,
          version: 1,
        }),
      ],
    })

    const published = await publishBlogPost(store, {
      id: 'post-1',
      expectedVersion: 1,
    })

    expect(published.status).toBe('published')
    expect(published.slugLocked).toBe(true)
    expect(published.version).toBe(2)
  })

  it('requires a cover before publish', async () => {
    const store = createStore({
      posts: [
        publishedRecord({
          status: 'draft',
          cover: '',
          publishedSnapshot: null,
          slugLocked: false,
          version: 1,
        }),
      ],
    })

    await expect(
      publishBlogPost(store, { id: 'post-1', expectedVersion: 1 }),
    ).rejects.toBeInstanceOf(BlogValidationError)
  })

  it('unpublishes while keeping working copy edits', async () => {
    const store = createStore({
      posts: [
        publishedRecord({
          title: 'Edited title',
          version: 4,
        }),
      ],
    })

    const draft = await unpublishBlogPost(store, {
      id: 'post-1',
      expectedVersion: 4,
    })

    expect(draft.status).toBe('draft')
    expect(draft.title).toBe('Edited title')
    expect(draft.hasUnpublishedChanges).toBe(false)
  })

  it('discards working copy back to the published snapshot', async () => {
    const store = createStore({
      posts: [
        publishedRecord({
          title: 'Dirty title',
          version: 5,
        }),
      ],
    })

    expect(hasUnpublishedChanges(store.posts[0]!)).toBe(true)

    const restored = await discardBlogPostChanges(store, {
      id: 'post-1',
      expectedVersion: 5,
    })

    expect(restored.title).toBe('Hello world')
  })
})
