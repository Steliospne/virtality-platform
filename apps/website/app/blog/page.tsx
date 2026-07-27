import { BlogIndex, getFeaturedPost, getPosts } from '@/sections/blog'

const BlogPage = () => {
  const posts = getPosts()
  const featured = getFeaturedPost()

  return <BlogIndex posts={posts} featured={featured} />
}

export default BlogPage
