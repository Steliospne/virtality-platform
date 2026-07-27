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

/** D — Quiet essay: typography-led index with a calm cover band under each title. */
export const VariantDIndex = ({ posts, featured, variant }: IndexProps) => {
  return (
    <div className='bg-white text-slate-900 dark:bg-zinc-950 dark:text-slate-100'>
      <header className='container mx-auto max-w-3xl px-4 pt-24 pb-16 md:px-8'>
        <p className='text-sm text-vital-blue-700'>Virtality</p>
        <h1 className='mt-4 text-5xl font-semibold tracking-tight text-balance md:text-6xl'>
          Writing
        </h1>
        <p className='mt-6 text-xl text-slate-600 dark:text-slate-400'>
          Long-form notes on recovery, attention, and clinic practice.
        </p>
      </header>

      <section className='container mx-auto max-w-3xl px-4 pb-28 md:px-8'>
        <ul className='space-y-20'>
          {posts.map((post) => {
            const isFeatured = post.slug === featured?.slug
            return (
              <li key={post.slug}>
                <Link
                  href={blogPrototypeHref(`/blog/${post.slug}`, variant)}
                  className='group block'
                >
                  <div className='flex items-baseline justify-between gap-4'>
                    <p className='text-sm text-slate-500'>
                      {formatPrototypeDate(post.publishedAt)}
                    </p>
                    {isFeatured ? (
                      <p className='text-sm text-vital-blue-700'>Featured</p>
                    ) : null}
                  </div>
                  <h2 className='mt-3 text-3xl font-semibold text-balance transition-colors group-hover:text-vital-blue-700 md:text-4xl'>
                    {post.title}
                  </h2>
                  <div className='relative mt-6 aspect-[21/9] overflow-hidden bg-slate-100 dark:bg-zinc-900'>
                    <Image
                      src={post.cover}
                      alt=''
                      fill
                      className='object-cover transition-transform duration-700 group-hover:scale-[1.02]'
                      sizes='(max-width: 768px) 100vw, 768px'
                    />
                  </div>
                  <p className='mt-5 text-lg leading-relaxed text-slate-600 text-pretty dark:text-slate-400'>
                    {post.excerpt}
                  </p>
                  <p className='mt-4 text-sm text-slate-500 underline-offset-4 transition-all group-hover:underline'>
                    Read
                  </p>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}

export const VariantDPost = ({ post, variant }: PostProps) => {
  const [lead, ...rest] = post.body
  const leadIsParagraph = lead?.kind === 'paragraph'

  return (
    <article className='bg-white text-slate-900 dark:bg-zinc-950 dark:text-slate-100'>
      <div className='container mx-auto max-w-2xl px-4 pt-16 pb-10 md:px-8 md:pt-24'>
        <Link
          href={blogPrototypeHref('/blog', variant)}
          className='text-sm text-slate-500 transition-colors hover:text-vital-blue-700'
        >
          ← Writing
        </Link>
        <h1 className='mt-10 text-4xl font-semibold tracking-tight text-balance md:text-5xl'>
          {post.title}
        </h1>
        <p className='mt-6 text-xl leading-relaxed text-slate-600 text-pretty dark:text-slate-300'>
          {post.excerpt}
        </p>
        <p className='mt-8 text-sm text-slate-500'>
          {post.author.name}
          {post.author.role ? ` · ${post.author.role}` : ''}
          <span className='mx-2'>·</span>
          {formatPrototypeDate(post.publishedAt)}
        </p>
      </div>

      {leadIsParagraph ? (
        <div className='container mx-auto max-w-2xl px-4 md:px-8'>
          <p className='text-lg leading-relaxed text-slate-700 dark:text-slate-300'>
            {lead.text}
          </p>
        </div>
      ) : null}

      <div className='relative my-12 aspect-[21/9] w-full overflow-hidden bg-slate-100 md:my-16 dark:bg-zinc-900'>
        <Image
          src={post.cover}
          alt=''
          fill
          priority
          className='object-cover'
          sizes='100vw'
        />
      </div>

      <div className='container mx-auto max-w-2xl px-4 pb-24 md:px-8'>
        <BodyBlocks
          blocks={leadIsParagraph ? rest : post.body}
          className='space-y-8'
        />
        {post.author.image ? (
          <div className='mt-16 flex items-center gap-4 border-t border-slate-200 pt-10 dark:border-zinc-800'>
            <Image
              src={post.author.image}
              alt=''
              width={56}
              height={56}
              className='size-14 rounded-full object-cover'
            />
            <div>
              <p className='font-medium'>{post.author.name}</p>
              {post.author.role ? (
                <p className='text-sm text-slate-500'>{post.author.role}</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </article>
  )
}
