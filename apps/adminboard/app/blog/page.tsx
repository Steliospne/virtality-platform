import { BlogPostsDashboard } from '@/components/blog/blog-posts-dashboard'

export const dynamic = 'force-dynamic'

const BlogPage = () => {
  return (
    <div className='min-h-screen-with-header mx-auto max-w-7xl px-4 py-6'>
      <div className='mb-8'>
        <h1 className='text-4xl font-bold tracking-tight'>Blog</h1>
        <p className='text-muted-foreground mt-2'>
          Create, draft, publish, and archive Posts. The website owns
          presentation; this board owns the content.
        </p>
      </div>
      <BlogPostsDashboard />
    </div>
  )
}

export default BlogPage
