import Image from 'next/image'
import Link from 'next/link'
import { shouldBypassVercelImageOptimization } from '@virtality/shared/utils'
import type { ResolvedPost } from '../types'
import BodyBlocks from './body-blocks'
import { formatPostDate } from '../lib/format'

type BlogPostViewProps = {
  post: ResolvedPost
}

const BlogPostView = ({ post }: BlogPostViewProps) => {
  return (
    <article className='min-h-screen bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-slate-100'>
      <div className='container mx-auto grid gap-10 px-4 py-14 md:grid-cols-[180px_minmax(0,42rem)] md:px-8 md:py-20 lg:grid-cols-[220px_minmax(0,42rem)_1fr]'>
        <aside className='space-y-6 md:sticky md:top-24 md:self-start'>
          <Link
            href='/blog'
            className='font-mono text-xs tracking-[0.18em] text-slate-500 uppercase transition-colors hover:text-vital-blue-700'
          >
            ← Journal
          </Link>
          <div className='space-y-2 font-mono text-xs tracking-wide text-slate-500 uppercase'>
            <p>{formatPostDate(post.publishedAt)}</p>
            {post.featured ? (
              <p className='text-vital-blue-700'>Featured</p>
            ) : null}
          </div>
          <div className='flex items-center gap-3 pt-2'>
            {post.author.image ? (
              <Image
                src={post.author.image}
                alt=''
                width={40}
                height={40}
                unoptimized={shouldBypassVercelImageOptimization(
                  post.author.image,
                )}
                className='size-10 rounded-full object-cover'
              />
            ) : null}
            <div>
              <p className='text-sm font-medium normal-case tracking-normal'>
                {post.author.name}
              </p>
              {post.author.role ? (
                <p className='text-xs font-sans tracking-normal text-slate-500 normal-case'>
                  {post.author.role}
                </p>
              ) : null}
            </div>
          </div>
        </aside>

        <div>
          <h1 className='text-4xl font-medium tracking-tight text-balance md:text-5xl'>
            {post.title}
          </h1>
          <p className='mt-6 text-xl text-slate-600 text-pretty dark:text-slate-300'>
            {post.excerpt}
          </p>
          <BodyBlocks blocks={post.body} className='mt-10 space-y-8' />
        </div>
      </div>
    </article>
  )
}

export default BlogPostView
