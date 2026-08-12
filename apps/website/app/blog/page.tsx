import { BlogIndex, getFeaturedPost, getPosts } from '@/sections/blog'

export const dynamic = 'force-dynamic'

const BlogPage = async () => {
  const [posts, featured] = await Promise.all([getPosts(), getFeaturedPost()])

  return <BlogIndex posts={posts} featured={featured} />
}

export default BlogPage
