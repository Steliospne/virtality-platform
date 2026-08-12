import {
  getCachedBlogPostBySlug,
  getCachedBlogPosts,
} from '@/lib/marketing-prefetch'
import type { ResolvedPost } from '../types'

/** Resolved Posts newest-first (published snapshot only). */
export async function getPosts(): Promise<ResolvedPost[]> {
  return getCachedBlogPosts()
}

export async function getPostBySlug(
  slug: string,
): Promise<ResolvedPost | undefined> {
  const post = await getCachedBlogPostBySlug(slug)
  return post ?? undefined
}

/** Soft uniqueness: returns the first Featured Post when several are flagged. */
export async function getFeaturedPost(): Promise<ResolvedPost | undefined> {
  const posts = await getPosts()
  return posts.find((post) => post.featured)
}
