import Image from 'next/image'
import Link from 'next/link'
import type { BlogPrototypeVariantKey, ResolvedPost } from '../types'
import BodyBlocks from '../components/body-blocks'
import { blogPrototypeHref, formatPrototypeDate } from '../lib/prototype-utils'

type IndexProps = {
  posts: ResolvedPost[]
  featured: ResolvedPost | undefined
  variant: BlogPrototypeVariantKey
}

type PostProps = {
  post: ResolvedPost
  variant: BlogPrototypeVariantKey
}

/** B — Meta rail: narrow date/author column + copy + cover on the right. */
export const VariantBIndex = ({ posts, featured, variant }: IndexProps) => {
  return (
    <div className='min-h-screen bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-slate-100'>
      <header className='border-b border-slate-300/70 dark:border-zinc-800'>
        <div className='container mx-auto grid gap-8 px-4 py-16 md:grid-cols-[180px_1fr] md:px-8 md:py-20'>
          <p className='font-mono text-xs tracking-[0.18em] text-slate-500 uppercase'>
            Journal
          </p>
          <div>
            <h1 className='max-w-3xl text-4xl font-medium tracking-tight text-balance md:text-5xl'>
              Notes from clinic floors and recovery rooms
            </h1>
            <p className='mt-5 max-w-xl text-lg text-slate-600 dark:text-slate-400'>
              Quiet writing on immersive rehab — no marketing kit, just the
              questions teams ask between sessions.
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
                href={blogPrototypeHref(`/blog/${post.slug}`, variant)}
                className='group grid gap-6 py-12 md:grid-cols-[180px_minmax(0,1fr)_240px] md:items-center md:gap-8'
              >
                <div className='space-y-2 font-mono text-xs tracking-wide text-slate-500 uppercase'>
                  <p>{formatPrototypeDate(post.publishedAt)}</p>
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

export const VariantBPost = ({ post, variant }: PostProps) => {
  return (
    <article className='min-h-screen bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-slate-100'>
      <div className='container mx-auto grid gap-10 px-4 py-14 md:grid-cols-[180px_minmax(0,42rem)] md:px-8 md:py-20 lg:grid-cols-[220px_minmax(0,42rem)_1fr]'>
        <aside className='space-y-6 md:sticky md:top-24 md:self-start'>
          <Link
            href={blogPrototypeHref('/blog', variant)}
            className='font-mono text-xs tracking-[0.18em] text-slate-500 uppercase transition-colors hover:text-vital-blue-700'
          >
            ← Journal
          </Link>
          <div className='space-y-2 font-mono text-xs tracking-wide text-slate-500 uppercase'>
            <p>{formatPrototypeDate(post.publishedAt)}</p>
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
          <div className='relative mt-10 aspect-[4/3] overflow-hidden bg-slate-200 dark:bg-zinc-800'>
            <Image
              src={post.cover}
              alt=''
              fill
              priority
              className='object-cover'
              sizes='(max-width: 768px) 100vw, 672px'
            />
          </div>
          <BodyBlocks blocks={post.body} className='mt-10 space-y-8' />
        </div>
      </div>
    </article>
  )
}
