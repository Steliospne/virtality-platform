import { describe, expect, it } from 'vitest'
import { getFeaturedPost, getPostBySlug, getPosts } from './posts'

describe('blog post read helpers', () => {
  it('returns resolved posts newest-first with joined authors', () => {
    const list = getPosts()

    expect(list.length).toBeGreaterThan(0)
    expect(list.every((post) => post.author.id === post.authorId)).toBe(true)
    expect(list.map((post) => post.publishedAt)).toEqual(
      [...list.map((post) => post.publishedAt)].sort((a, b) =>
        b.localeCompare(a),
      ),
    )
  })

  it('looks up a post by slug', () => {
    const post = getPostBySlug('panhellenic-physiotherapy-conference')

    expect(post?.slug).toBe('panhellenic-physiotherapy-conference')
    expect(post?.author.name).toBe('Katerina Tsiraki')
    expect(post?.body.some((block) => block.kind === 'heading')).toBe(true)
    expect(post?.body.some((block) => block.kind === 'paragraph')).toBe(true)
  })

  it('returns undefined for an unknown slug', () => {
    expect(getPostBySlug('does-not-exist')).toBeUndefined()
  })

  it('returns the featured post when one is flagged', () => {
    const featured = getFeaturedPost()
    const flagged = getPosts().filter((post) => post.featured)

    if (flagged.length === 0) {
      expect(featured).toBeUndefined()
      return
    }

    expect(featured?.featured).toBe(true)
    expect(featured?.slug).toBe(flagged[0]!.slug)
  })
})
