import { authors, posts } from '../content'
import type { Author, Post, ResolvedPost } from '../types'

function getAuthor(authorId: string): Author {
  const author = authors.find((entry) => entry.id === authorId)
  if (!author) {
    throw new Error(`Unknown blog author: ${authorId}`)
  }
  return author
}

function resolvePost(post: Post): ResolvedPost {
  return {
    ...post,
    author: getAuthor(post.authorId),
  }
}

/** Resolved Posts newest-first. */
export function getPosts(): ResolvedPost[] {
  return posts
    .map(resolvePost)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

export function getPostBySlug(slug: string): ResolvedPost | undefined {
  const post = posts.find((entry) => entry.slug === slug)
  return post ? resolvePost(post) : undefined
}

/** Soft uniqueness — returns the first Featured Post when several are flagged. */
export function getFeaturedPost(): ResolvedPost | undefined {
  return getPosts().find((post) => post.featured)
}
