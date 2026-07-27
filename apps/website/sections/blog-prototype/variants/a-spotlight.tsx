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

/** A — Spotlight stack: full-bleed featured cover, then a quiet stacked list. */
export const VariantAIndex = ({ posts, featured, variant }: IndexProps) => {
  const rest = posts.filter((post) => post.slug !== featured?.slug)

  return (
    <div className='bg-white text-slate-900 dark:bg-zinc-950 dark:text-slate-100'>
      {featured ? (
        <Link
          href={blogPrototypeHref(`/blog/${featured.slug}`, variant)}
          className='group relative block min-h-[70vh] overflow-hidden'
        >
          <Image
            src={featured.cover}
            alt=''
            fill
            priority
            className='object-cover transition-transform duration-700 group-hover:scale-[1.02]'
            sizes='100vw'
          />
          <div className='absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/55 to-zinc-950/15' />
          <div className='relative flex min-h-[70vh] items-end'>
            <div className='container mx-auto px-4 pb-16 pt-32 md:px-8 md:pb-20'>
              <p className='mb-4 text-sm tracking-[0.2em] text-white/70 uppercase'>
                Featured
              </p>
              <h1 className='max-w-4xl text-4xl font-semibold text-balance text-white md:text-6xl'>
                {featured.title}
              </h1>
              <p className='mt-5 max-w-2xl text-lg text-white/80 text-pretty'>
                {featured.excerpt}
              </p>
              <p className='mt-6 text-sm text-white/60'>
                {featured.author.name}
                {featured.author.role ? ` · ${featured.author.role}` : ''}
                <span className='mx-2'>·</span>
                {formatPrototypeDate(featured.publishedAt)}
              </p>
            </div>
          </div>
        </Link>
      ) : null}

      <section className='container mx-auto px-4 py-20 md:px-8'>
        <h2 className='mb-12 text-sm tracking-[0.2em] text-slate-500 uppercase'>
          Latest
        </h2>
        <ul className='divide-y divide-slate-200 dark:divide-zinc-800'>
          {rest.map((post) => (
            <li key={post.slug} className='py-10 first:pt-0'>
              <Link
                href={blogPrototypeHref(`/blog/${post.slug}`, variant)}
                className='group grid items-start gap-6 md:grid-cols-[140px_200px_1fr]'
              >
                <p className='text-sm text-slate-500'>
                  {formatPrototypeDate(post.publishedAt)}
                </p>
                <div className='relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-zinc-800'>
                  <Image
                    src={post.cover}
                    alt=''
                    fill
                    className='object-cover transition-transform duration-500 group-hover:scale-[1.03]'
                    sizes='200px'
                  />
                </div>
                <div>
                  <h3 className='text-2xl font-semibold text-balance transition-colors group-hover:text-vital-blue-700 md:text-3xl'>
                    {post.title}
                  </h3>
                  <p className='mt-3 max-w-2xl text-slate-600 text-pretty dark:text-slate-400'>
                    {post.excerpt}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

export const VariantAPost = ({ post, variant }: PostProps) => {
  return (
    <article className='bg-white text-slate-900 dark:bg-zinc-950 dark:text-slate-100'>
      <div className='relative min-h-[55vh] overflow-hidden'>
        <Image
          src={post.cover}
          alt=''
          fill
          priority
          className='object-cover'
          sizes='100vw'
        />
        <div className='absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/50 to-transparent' />
        <div className='relative flex min-h-[55vh] items-end'>
          <div className='container mx-auto px-4 pb-12 md:px-8 md:pb-16'>
            <Link
              href={blogPrototypeHref('/blog', variant)}
              className='text-sm text-white/70 transition-colors hover:text-white'
            >
              ← All posts
            </Link>
            <h1 className='mt-6 max-w-4xl text-4xl font-semibold text-balance text-white md:text-5xl'>
              {post.title}
            </h1>
          </div>
        </div>
      </div>

      <div className='container mx-auto max-w-3xl px-4 py-14 md:px-8'>
        <p className='text-xl text-slate-600 text-pretty dark:text-slate-300'>
          {post.excerpt}
        </p>
        <div className='mt-8 flex items-center gap-4 border-b border-slate-200 pb-8 dark:border-zinc-800'>
          {post.author.image ? (
            <Image
              src={post.author.image}
              alt=''
              width={48}
              height={48}
              className='size-12 rounded-full object-cover'
            />
          ) : null}
          <div>
            <p className='font-medium'>{post.author.name}</p>
            <p className='text-sm text-slate-500'>
              {post.author.role ? `${post.author.role} · ` : ''}
              {formatPrototypeDate(post.publishedAt)}
            </p>
          </div>
        </div>
        <BodyBlocks blocks={post.body} className='mt-10 space-y-8' />
      </div>
    </article>
  )
}
