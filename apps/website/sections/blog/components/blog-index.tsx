import Image from 'next/image'
import Link from 'next/link'
import type { ResolvedPost } from '../types'
import { formatPostDate } from '../lib/format'

type BlogIndexProps = {
  posts: ResolvedPost[]
  featured: ResolvedPost | undefined
}

/** Meta rail: narrow date/author column + copy + cover on the right. */
const BlogIndex = ({ posts, featured }: BlogIndexProps) => {
  return (
    <div className='min-h-screen bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-slate-100'>
      <header className='border-b border-slate-300/70 dark:border-zinc-800'>
        <div className='container mx-auto grid gap-8 px-4 py-16 md:grid-cols-[180px_1fr] md:px-8 md:py-20'>
          <p className='font-mono text-xs tracking-[0.18em] text-slate-500 uppercase'>
            Journal
          </p>
          <div>
            <h1 className='max-w-3xl text-4xl font-medium tracking-tight text-balance md:text-5xl'>
              Notes from latest news and updates
            </h1>
            <p className='mt-5 max-w-xl text-lg text-slate-600 dark:text-slate-400'>
              Short notes on immersive rehab, clinic pilots, and what we are
              building next.
            </p>
          </div>
        </div>
      </header>

      <ul className='container mx-auto px-4 md:px-8'>
        {posts.map((post) => {
          const isFeatured = post.slug === featured?.slug
          return (
            <li
              key={post.slug}
              className='border-b border-slate-300/70 dark:border-zinc-800'
            >
              <Link
                href={`/blog/${post.slug}`}
                className='group grid gap-6 py-12 md:grid-cols-[180px_minmax(0,1fr)_240px] md:items-center md:gap-8'
              >
                <div className='space-y-2 font-mono text-xs tracking-wide text-slate-500 uppercase'>
                  <p>{formatPostDate(post.publishedAt)}</p>
                  {isFeatured ? (
                    <p className='text-vital-blue-700'>Featured</p>
                  ) : null}
                </div>
                <div>
                  <h2 className='text-2xl font-medium text-balance transition-colors group-hover:text-vital-blue-700 md:text-3xl'>
                    {post.title}
                  </h2>
                  <p className='mt-3 max-w-2xl text-slate-600 text-pretty dark:text-slate-400'>
                    {post.excerpt}
                  </p>
                  <p className='mt-4 text-sm text-slate-500'>
                    {post.author.name}
                    {post.author.role ? ` · ${post.author.role}` : ''}
                  </p>
                </div>
                <div className='relative aspect-[4/3] overflow-hidden bg-slate-200 dark:bg-zinc-800'>
                  <Image
                    src={post.cover}
                    alt=''
                    fill
                    className='object-cover transition-transform duration-500 group-hover:scale-[1.03]'
                    sizes='240px'
                  />
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default BlogIndex
