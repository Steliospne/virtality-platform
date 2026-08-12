import { notFound } from 'next/navigation'
import { BlogPostView, getPostBySlug } from '@/sections/blog'

export const dynamic = 'force-dynamic'

type BlogPostPageProps = {
  params: Promise<{ id: string }>
}

const BlogPostPage = async ({ params }: BlogPostPageProps) => {
  const { id } = await params
  const post = await getPostBySlug(id)

  if (!post) {
    notFound()
  }

  return <BlogPostView post={post} />
}

export default BlogPostPage
