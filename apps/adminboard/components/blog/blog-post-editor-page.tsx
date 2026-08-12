'use client'

import { BlogBodyEditor } from '@/components/blog/blog-body-editor'
import { BlogBodyPreview } from '@/components/blog/blog-body-preview'
import { BucketObjectPickerDialog } from '@/components/email/bucket-object-picker-dialog'
import { Button } from '@/components/ui/button'
import { BLOG_UPLOAD_PREFIX } from '@/lib/blog'
import { getErrorMessage } from '@/lib/get-error-message'
import { Input } from '@virtality/ui/components/input'
import { Label } from '@virtality/ui/components/label'
import { Textarea } from '@virtality/ui/components/textarea'
import {
  useAutosaveBlogPost,
  useBlogAuthors,
  useBlogPost,
  useDiscardBlogPostChanges,
  usePublishBlogPost,
  useUnpublishBlogPost,
} from '@virtality/react-query'
import { slugifyBlogTitle, bucketCdnUrl } from '@virtality/shared/utils'
import type { BodyBlock } from '@virtality/shared/types'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

type BlogPostEditorPageProps = {
  postId: string
}

type EditorState = {
  title: string
  slug: string
  excerpt: string
  cover: string
  coverFocusY: number
  authorId: string
  publishedAt: string
  body: BodyBlock[]
  version: number
}

function isConflictError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }
  return (
    error.message.includes('updated elsewhere') ||
    error.name === 'CONFLICT' ||
    /conflict/i.test(error.message)
  )
}

export function BlogPostEditorPage({ postId }: BlogPostEditorPageProps) {
  const { data: post, isLoading, error, refetch } = useBlogPost(postId)
  const { data: authors } = useBlogAuthors()
  const { mutateAsync: autosave } = useAutosaveBlogPost()
  const { mutateAsync: publish, isPending: isPublishing } = usePublishBlogPost()
  const { mutateAsync: unpublish, isPending: isUnpublishing } =
    useUnpublishBlogPost()
  const { mutateAsync: discard, isPending: isDiscarding } =
    useDiscardBlogPostChanges()

  const [state, setState] = useState<EditorState | null>(null)
  const [saveState, setSaveState] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle')
  const [coverPickerOpen, setCoverPickerOpen] = useState(false)
  const hydratedId = useRef<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stateRef = useRef<EditorState | null>(null)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    if (!post) {
      return
    }
    if (hydratedId.current === post.id && state) {
      return
    }
    hydratedId.current = post.id
    setState({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      cover: post.cover,
      coverFocusY: post.coverFocusY ?? 50,
      authorId: post.authorId,
      publishedAt: post.publishedAt ?? '',
      body: post.body,
      version: post.version,
    })
  }, [post, state])

  const queueAutosave = (next: EditorState, force = false) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(async () => {
      setSaveState('saving')
      try {
        const saved = await autosave({
          id: postId,
          expectedVersion: next.version,
          force,
          title: next.title,
          slug: next.slug,
          excerpt: next.excerpt,
          cover: next.cover,
          coverFocusY: next.coverFocusY,
          authorId: next.authorId,
          publishedAt: next.publishedAt || null,
          body: next.body,
        })
        setState((current) =>
          current
            ? {
                ...current,
                version: saved.version,
              }
            : current,
        )
        setSaveState('saved')
      } catch (err) {
        setSaveState('error')
        if (isConflictError(err)) {
          toast.error('This post was updated elsewhere. Reload or overwrite.', {
            action: {
              label: 'Reload',
              onClick: () => {
                hydratedId.current = null
                void refetch()
              },
            },
          })
          toast.message('Or overwrite your version onto the server.', {
            action: {
              label: 'Overwrite',
              onClick: () => {
                const latest = stateRef.current
                if (!latest) {
                  return
                }
                queueAutosave(latest, true)
              },
            },
          })
          return
        }
        toast.error(getErrorMessage(err, 'Autosave failed.'))
      }
    }, 800)
  }

  const patchState = (patch: Partial<EditorState>) => {
    setState((current) => {
      if (!current) {
        return current
      }
      const next = { ...current, ...patch }
      queueAutosave(next)
      return next
    })
  }

  if (isLoading || !state) {
    return (
      <div className='text-muted-foreground min-h-screen-with-header flex items-center justify-center gap-2'>
        <Loader2 className='size-4 animate-spin' />
        Loading editor…
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className='mx-auto max-w-3xl px-4 py-10'>
        <p className='text-destructive'>
          {getErrorMessage(error, 'Post not found.')}
        </p>
        <Button asChild className='mt-4' variant='outline'>
          <Link href='/blog'>Back to list</Link>
        </Button>
      </div>
    )
  }

  const slugLocked = post.slugLocked

  return (
    <div className='min-h-screen-with-header mx-auto max-w-7xl px-4 py-6'>
      <div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
        <div className='space-y-1'>
          <Button asChild variant='ghost' size='sm' className='-ml-2'>
            <Link href='/blog'>
              <ArrowLeft className='size-4' />
              Blog
            </Link>
          </Button>
          <h1 className='text-3xl font-bold tracking-tight'>Edit post</h1>
          <p className='text-muted-foreground text-sm'>
            Status: {post.status}
            {post.hasUnpublishedChanges ? ' · unpublished edits' : ''}
            {' · '}
            {saveState === 'saving'
              ? 'Saving…'
              : saveState === 'saved'
                ? 'Saved'
                : saveState === 'error'
                  ? 'Save error'
                  : 'Autosave on'}
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          {post.status === 'published' && post.hasUnpublishedChanges ? (
            <Button
              type='button'
              variant='outline'
              disabled={isDiscarding}
              onClick={async () => {
                try {
                  const restored = await discard({
                    id: post.id,
                    expectedVersion: state.version,
                  })
                  hydratedId.current = null
                  setState({
                    title: restored.title,
                    slug: restored.slug,
                    excerpt: restored.excerpt,
                    cover: restored.cover,
                    coverFocusY: restored.coverFocusY ?? 50,
                    authorId: restored.authorId,
                    publishedAt: restored.publishedAt ?? '',
                    body: restored.body,
                    version: restored.version,
                  })
                  toast.success('Discarded unpublished edits.')
                } catch (err) {
                  toast.error(getErrorMessage(err, 'Could not discard.'))
                }
              }}
            >
              Discard changes
            </Button>
          ) : null}
          {post.status === 'published' ? (
            <Button
              type='button'
              variant='outline'
              disabled={isUnpublishing}
              onClick={async () => {
                try {
                  await unpublish({
                    id: post.id,
                    expectedVersion: state.version,
                  })
                  hydratedId.current = null
                  await refetch()
                  toast.success('Unpublished.')
                } catch (err) {
                  toast.error(getErrorMessage(err, 'Could not unpublish.'))
                }
              }}
            >
              Unpublish
            </Button>
          ) : null}
          <Button
            type='button'
            disabled={isPublishing || post.status === 'archived'}
            onClick={async () => {
              try {
                if (debounceRef.current) {
                  clearTimeout(debounceRef.current)
                }
                const saved = await autosave({
                  id: postId,
                  expectedVersion: state.version,
                  title: state.title,
                  slug: state.slug,
                  excerpt: state.excerpt,
                  cover: state.cover,
                  coverFocusY: state.coverFocusY,
                  authorId: state.authorId,
                  publishedAt: state.publishedAt || null,
                  body: state.body,
                })
                await publish({
                  id: post.id,
                  expectedVersion: saved.version,
                })
                hydratedId.current = null
                await refetch()
                toast.success('Published.')
              } catch (err) {
                toast.error(getErrorMessage(err, 'Could not publish.'))
              }
            }}
          >
            {isPublishing ? <Loader2 className='size-4 animate-spin' /> : null}
            Publish
          </Button>
        </div>
      </div>

      <div className='grid gap-8 lg:grid-cols-2'>
        <div className='space-y-5'>
          <div className='space-y-2'>
            <Label htmlFor='blog-title'>Title</Label>
            <Input
              id='blog-title'
              value={state.title}
              onChange={(event) => patchState({ title: event.target.value })}
            />
          </div>

          <div className='space-y-2'>
            <div className='flex items-center justify-between gap-2'>
              <Label htmlFor='blog-slug'>Slug</Label>
              {!slugLocked ? (
                <Button
                  type='button'
                  size='sm'
                  variant='outline'
                  onClick={() =>
                    patchState({ slug: slugifyBlogTitle(state.title) })
                  }
                >
                  Generate from title
                </Button>
              ) : null}
            </div>
            <Input
              id='blog-slug'
              value={state.slug}
              disabled={slugLocked}
              onChange={(event) => patchState({ slug: event.target.value })}
            />
            {slugLocked ? (
              <p className='text-muted-foreground text-xs'>
                Locked after first publish.
              </p>
            ) : null}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='blog-excerpt'>Excerpt</Label>
            <Textarea
              id='blog-excerpt'
              value={state.excerpt}
              rows={3}
              onChange={(event) => patchState({ excerpt: event.target.value })}
            />
          </div>

          <div className='space-y-2'>
            <Label>Cover</Label>
            <div className='flex flex-wrap gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setCoverPickerOpen(true)}
              >
                Choose from bucket
              </Button>
              {state.cover ? (
                <Button
                  type='button'
                  variant='ghost'
                  onClick={() => patchState({ cover: '' })}
                >
                  Clear
                </Button>
              ) : null}
            </div>
            {state.cover ? (
              <div className='relative aspect-video overflow-hidden rounded-md border bg-slate-100'>
                <Image
                  src={state.cover}
                  alt='Cover preview'
                  fill
                  unoptimized
                  className='object-cover'
                  style={{ objectPosition: `center ${state.coverFocusY}%` }}
                />
              </div>
            ) : null}
            <div className='space-y-1'>
              <Label htmlFor='cover-focus'>
                Cover focus ({state.coverFocusY})
              </Label>
              <input
                id='cover-focus'
                type='range'
                min={0}
                max={100}
                value={state.coverFocusY}
                className='w-full'
                onChange={(event) =>
                  patchState({ coverFocusY: Number(event.target.value) })
                }
              />
            </div>
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='blog-author'>Author</Label>
              <select
                id='blog-author'
                className='border-input bg-background h-9 w-full rounded-md border px-3 text-sm'
                value={state.authorId}
                onChange={(event) =>
                  patchState({ authorId: event.target.value })
                }
              >
                {(authors ?? []).map((author) => (
                  <option key={author.id} value={author.id}>
                    {author.name}
                  </option>
                ))}
              </select>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='blog-published-at'>Published date</Label>
              <Input
                id='blog-published-at'
                type='date'
                value={state.publishedAt}
                onChange={(event) =>
                  patchState({ publishedAt: event.target.value })
                }
              />
            </div>
          </div>

          <BlogBodyEditor
            blocks={state.body}
            onChange={(body) => patchState({ body })}
          />
        </div>

        <div className='space-y-3'>
          <h2 className='text-lg font-semibold'>Preview</h2>
          <BlogBodyPreview
            title={state.title}
            excerpt={state.excerpt}
            cover={state.cover}
            coverFocusY={state.coverFocusY}
            blocks={state.body}
          />
        </div>
      </div>

      <BucketObjectPickerDialog
        open={coverPickerOpen}
        onOpenChange={setCoverPickerOpen}
        objectKind='image'
        onSelect={(objectKey) => {
          patchState({ cover: bucketCdnUrl(objectKey) })
          setCoverPickerOpen(false)
        }}
      />
      {/* Prefixed uploads are managed in Bucket under marketing/blogs */}
      <span className='sr-only'>{BLOG_UPLOAD_PREFIX}</span>
    </div>
  )
}
