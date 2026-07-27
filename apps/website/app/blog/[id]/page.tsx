import { notFound } from 'next/navigation'
import {
  BlogPrototypePost,
  getPrototypePostBySlug,
  parseBlogPrototypeVariant,
} from '@/sections/blog-prototype'

type BlogPostPageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ variant?: string | string[] }>
}

/**
 * PROTOTYPE host — existing /blog/[id] route; `id` is the post slug for sample content.
 */
const BlogPostPage = async ({ params, searchParams }: BlogPostPageProps) => {
  const { id } = await params
  const query = await searchParams
  const variant = parseBlogPrototypeVariant(query.variant)
  const post = getPrototypePostBySlug(id)

  if (!post) {
    notFound()
  }

  return <BlogPrototypePost post={post} variant={variant} />
}

export default BlogPostPage
