'use client'

import { Button } from '@/components/ui/button'
import { BLOG_STATUS_LABELS } from '@/lib/blog'
import { getErrorMessage } from '@/lib/get-error-message'
import { Badge } from '@virtality/ui/components/badge'
import {
  useArchiveBlogPost,
  useBlogPosts,
  useCreateBlogDraft,
  useRestoreBlogPost,
  useSetBlogPostFeatured,
  useUnpublishBlogPost,
} from '@virtality/react-query'
import type { BlogPostStatus } from '@virtality/shared/types'
import { Loader2, Plus, Star } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

const FILTERS: Array<{ id: 'all' | BlogPostStatus; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Drafts' },
  { id: 'published', label: 'Published' },
  { id: 'archived', label: 'Archived' },
]

export function BlogPostsDashboard() {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | BlogPostStatus>('all')
  const status = filter === 'all' ? undefined : filter
  const { data: posts, isLoading, error } = useBlogPosts(status)
  const { mutateAsync: createDraft, isPending: isCreating } =
    useCreateBlogDraft()
  const { mutateAsync: archivePost } = useArchiveBlogPost()
  const { mutateAsync: restorePost } = useRestoreBlogPost()
  const { mutateAsync: unpublishPost } = useUnpublishBlogPost()
  const { mutateAsync: setFeatured } = useSetBlogPostFeatured()

  const sorted = useMemo(() => posts ?? [], [posts])

  const handleCreate = async () => {
    try {
      const draft = await createDraft({})
      router.push(`/blog/${draft.id}`)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not create draft.'))
    }
  }

  if (isLoading) {
    return (
      <div className='text-muted-foreground flex items-center gap-2'>
        <Loader2 className='size-4 animate-spin' />
        Loading posts…
      </div>
    )
  }

  if (error) {
    return (
      <p className='text-destructive'>
        {getErrorMessage(error, 'Could not load posts.')}
      </p>
    )
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex flex-wrap gap-2'>
          {FILTERS.map((entry) => (
            <Button
              key={entry.id}
              type='button'
              size='sm'
              variant={filter === entry.id ? 'default' : 'outline'}
              onClick={() => setFilter(entry.id)}
            >
              {entry.label}
            </Button>
          ))}
        </div>
        <Button type='button' onClick={handleCreate} disabled={isCreating}>
          {isCreating ? (
            <Loader2 className='size-4 animate-spin' />
          ) : (
            <Plus className='size-4' />
          )}
          New draft
        </Button>
      </div>

      {sorted.length === 0 ? (
        <p className='text-muted-foreground'>No posts in this filter.</p>
      ) : (
        <ul className='divide-border divide-y rounded-lg border'>
          {sorted.map((post) => (
            <li
              key={post.id}
              className='flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between'
            >
              <div className='min-w-0 space-y-1'>
                <div className='flex flex-wrap items-center gap-2'>
                  <Link
                    href={`/blog/${post.id}`}
                    className='truncate font-medium hover:underline'
                  >
                    {post.title || 'Untitled'}
                  </Link>
                  <Badge variant='secondary'>
                    {BLOG_STATUS_LABELS[post.status]}
                  </Badge>
                  {post.featured ? (
                    <Badge variant='outline'>Featured</Badge>
                  ) : null}
                  {post.hasUnpublishedChanges ? (
                    <Badge variant='outline'>Unpublished edits</Badge>
                  ) : null}
                </div>
                <p className='text-muted-foreground truncate text-sm'>
                  /{post.slug}
                  {post.publishedAt ? ` · ${post.publishedAt}` : ''}
                </p>
              </div>
              <div className='flex flex-wrap gap-2'>
                <Button asChild size='sm' variant='outline'>
                  <Link href={`/blog/${post.id}`}>Edit</Link>
                </Button>
                {post.status === 'published' ? (
                  <>
                    <Button
                      type='button'
                      size='sm'
                      variant='outline'
                      onClick={async () => {
                        try {
                          await setFeatured({
                            id: post.id,
                            expectedVersion: post.version,
                            featured: !post.featured,
                          })
                          toast.success(
                            post.featured
                              ? 'Featured cleared.'
                              : 'Marked as featured.',
                          )
                        } catch (err) {
                          toast.error(
                            getErrorMessage(err, 'Could not update featured.'),
                          )
                        }
                      }}
                    >
                      <Star className='size-4' />
                      {post.featured ? 'Unfeature' : 'Feature'}
                    </Button>
                    <Button
                      type='button'
                      size='sm'
                      variant='outline'
                      onClick={async () => {
                        try {
                          await unpublishPost({
                            id: post.id,
                            expectedVersion: post.version,
                          })
                          toast.success('Unpublished.')
                        } catch (err) {
                          toast.error(
                            getErrorMessage(err, 'Could not unpublish.'),
                          )
                        }
                      }}
                    >
                      Unpublish
                    </Button>
                  </>
                ) : null}
                {post.status === 'archived' ? (
                  <Button
                    type='button'
                    size='sm'
                    variant='outline'
                    onClick={async () => {
                      try {
                        await restorePost({
                          id: post.id,
                          expectedVersion: post.version,
                        })
                        toast.success('Restored to draft.')
                      } catch (err) {
                        toast.error(getErrorMessage(err, 'Could not restore.'))
                      }
                    }}
                  >
                    Restore
                  </Button>
                ) : (
                  <Button
                    type='button'
                    size='sm'
                    variant='outline'
                    onClick={async () => {
                      try {
                        await archivePost({
                          id: post.id,
                          expectedVersion: post.version,
                        })
                        toast.success('Archived.')
                      } catch (err) {
                        toast.error(getErrorMessage(err, 'Could not archive.'))
                      }
                    }}
                  >
                    Archive
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
