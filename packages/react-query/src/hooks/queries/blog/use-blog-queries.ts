import { useQuery } from '@tanstack/react-query'
import type { BlogPostStatus } from '@virtality/shared/types'
import { useORPC } from '../../../orpc-context.js'

export function useBlogAuthors() {
  const orpc = useORPC()
  return useQuery(orpc.blog.listAuthors.queryOptions())
}

export function useBlogPosts(status?: BlogPostStatus) {
  const orpc = useORPC()
  return useQuery(
    orpc.blog.list.queryOptions({
      input: status ? { status } : {},
    }),
  )
}

export function useBlogPost(id: string | null) {
  const orpc = useORPC()
  return useQuery({
    ...orpc.blog.get.queryOptions({
      input: { id: id ?? '' },
    }),
    enabled: Boolean(id),
  })
}

export function usePublishedBlogPosts() {
  const orpc = useORPC()
  return useQuery(orpc.blog.listPublished.queryOptions())
}
