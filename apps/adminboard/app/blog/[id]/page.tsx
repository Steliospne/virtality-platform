import { BlogPostEditorPage } from '@/components/blog/blog-post-editor-page'

export const dynamic = 'force-dynamic'

type BlogEditorRouteProps = {
  params: Promise<{ id: string }>
}

const BlogEditorRoute = async ({ params }: BlogEditorRouteProps) => {
  const { id } = await params
  return <BlogPostEditorPage postId={id} />
}

export default BlogEditorRoute
