import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

function invalidateBlogQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  orpc: ReturnType<typeof useORPC>,
) {
  void queryClient.invalidateQueries({
    queryKey: orpc.blog.list.key(),
  })
  void queryClient.invalidateQueries({
    queryKey: orpc.blog.listAuthors.key(),
  })
  void queryClient.invalidateQueries({
    queryKey: orpc.blog.get.key(),
  })
  void queryClient.invalidateQueries({
    queryKey: orpc.blog.listPublished.key(),
  })
}

export function useCreateBlogDraft() {
  const orpc = useORPC()
  const queryClient = useQueryClient()

  return useMutation(
    orpc.blog.createDraft.mutationOptions({
      onSuccess: () => {
        invalidateBlogQueries(queryClient, orpc)
      },
    }),
  )
}

export function useAutosaveBlogPost() {
  const orpc = useORPC()
  const queryClient = useQueryClient()

  return useMutation({
    ...orpc.blog.autosave.mutationOptions(),
    onSuccess: (data) => {
      queryClient.setQueryData(
        orpc.blog.get.queryKey({ input: { id: data.id } }),
        data,
      )
      void queryClient.invalidateQueries({
        queryKey: orpc.blog.list.key(),
      })
    },
  })
}

export function usePublishBlogPost() {
  const orpc = useORPC()
  const queryClient = useQueryClient()

  return useMutation(
    orpc.blog.publish.mutationOptions({
      onSuccess: () => {
        invalidateBlogQueries(queryClient, orpc)
      },
    }),
  )
}

export function useUnpublishBlogPost() {
  const orpc = useORPC()
  const queryClient = useQueryClient()

  return useMutation(
    orpc.blog.unpublish.mutationOptions({
      onSuccess: () => {
        invalidateBlogQueries(queryClient, orpc)
      },
    }),
  )
}

export function useDiscardBlogPostChanges() {
  const orpc = useORPC()
  const queryClient = useQueryClient()

  return useMutation(
    orpc.blog.discardChanges.mutationOptions({
      onSuccess: (data) => {
        queryClient.setQueryData(
          orpc.blog.get.queryKey({ input: { id: data.id } }),
          data,
        )
        void queryClient.invalidateQueries({
          queryKey: orpc.blog.list.key(),
        })
      },
    }),
  )
}

export function useArchiveBlogPost() {
  const orpc = useORPC()
  const queryClient = useQueryClient()

  return useMutation(
    orpc.blog.archive.mutationOptions({
      onSuccess: () => {
        invalidateBlogQueries(queryClient, orpc)
      },
    }),
  )
}

export function useRestoreBlogPost() {
  const orpc = useORPC()
  const queryClient = useQueryClient()

  return useMutation(
    orpc.blog.restore.mutationOptions({
      onSuccess: () => {
        invalidateBlogQueries(queryClient, orpc)
      },
    }),
  )
}

export function useSetBlogPostFeatured() {
  const orpc = useORPC()
  const queryClient = useQueryClient()

  return useMutation(
    orpc.blog.setFeatured.mutationOptions({
      onSuccess: () => {
        invalidateBlogQueries(queryClient, orpc)
      },
    }),
  )
}
