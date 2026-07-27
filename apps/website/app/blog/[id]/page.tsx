import { notFound } from 'next/navigation'
import { BlogPostView, getPostBySlug } from '@/sections/blog'

type BlogPostPageProps = {
  params: Promise<{ id: string }>
}

const BlogPostPage = async ({ params }: BlogPostPageProps) => {
  const { id } = await params
  const post = getPostBySlug(id)

  if (!post) {
    notFound()
  }

  return <BlogPostView post={post} />
}

export default BlogPostPage
