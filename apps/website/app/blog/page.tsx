import {
  BlogPrototypeIndex,
  getFeaturedPrototypePost,
  getPrototypePosts,
  parseBlogPrototypeVariant,
} from '@/sections/blog-prototype'

type BlogPageProps = {
  searchParams: Promise<{ variant?: string | string[] }>
}

/**
 * PROTOTYPE host — existing /blog route renders look-and-feel variants via ?variant=
 */
const BlogPage = async ({ searchParams }: BlogPageProps) => {
  const params = await searchParams
  const variant = parseBlogPrototypeVariant(params.variant)
  const posts = getPrototypePosts()
  const featured = getFeaturedPrototypePost()

  return (
    <BlogPrototypeIndex posts={posts} featured={featured} variant={variant} />
  )
}

export default BlogPage
