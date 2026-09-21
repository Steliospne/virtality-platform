import { BlogPostsDashboard } from '@/components/blog/blog-posts-dashboard'

export const dynamic = 'force-dynamic'

const BlogPage = () => {
  return (
    <div className='min-h-screen-with-header mx-auto max-w-7xl px-4 py-6'>
      <BlogPostsDashboard />
    </div>
  )
}

export default BlogPage
