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

/** C — Cover mosaic: image-first grid; featured spans two columns. */
export const VariantCIndex = ({ posts, featured, variant }: IndexProps) => {
  const ordered = featured
    ? [featured, ...posts.filter((post) => post.slug !== featured.slug)]
    : posts

  return (
    <div className='bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-slate-100'>
      <header className='container mx-auto px-4 pt-16 pb-10 md:px-8 md:pt-20'>
        <h1 className='text-4xl font-semibold tracking-tight md:text-5xl'>
          Insights
        </h1>
        <p className='mt-4 max-w-xl text-lg text-slate-600 dark:text-slate-400'>
          Cover-led reading — the image leads, the words follow.
        </p>
      </header>

      <section className='container mx-auto grid gap-5 px-4 pb-20 md:grid-cols-2 md:px-8 lg:gap-6'>
        {ordered.map((post, index) => {
          const isFeatured = index === 0 && post.featured
          return (
            <Link
              key={post.slug}
              href={blogPrototypeHref(`/blog/${post.slug}`, variant)}
              className={`group relative overflow-hidden bg-zinc-900 ${
                isFeatured
                  ? 'min-h-[28rem] md:col-span-2 md:min-h-[36rem]'
                  : 'min-h-[22rem]'
              }`}
            >
              <Image
                src={post.cover}
                alt=''
                fill
                priority={isFeatured}
                className='object-cover opacity-90 transition-transform duration-700 group-hover:scale-[1.03]'
                sizes={isFeatured ? '100vw' : '(max-width: 768px) 100vw, 50vw'}
              />
              <div className='absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/40 to-transparent' />
              <div className='absolute inset-x-0 bottom-0 p-6 md:p-8'>
                {isFeatured ? (
                  <p className='mb-3 text-xs tracking-[0.2em] text-white/70 uppercase'>
                    Featured
                  </p>
                ) : null}
                <h2
                  className={`font-semibold text-balance text-white ${
                    isFeatured ? 'text-3xl md:text-5xl' : 'text-2xl md:text-3xl'
                  }`}
                >
                  {post.title}
                </h2>
                <p className='mt-3 max-w-2xl text-sm text-white/75 md:text-base'>
                  {formatPrototypeDate(post.publishedAt)}
                  <span className='mx-2'>·</span>
                  {post.author.name}
                </p>
              </div>
            </Link>
          )
        })}
      </section>
    </div>
  )
}

export const VariantCPost = ({ post, variant }: PostProps) => {
  return (
    <article className='bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-slate-100'>
      <div className='relative min-h-[60vh] overflow-hidden md:min-h-[70vh]'>
        <Image
          src={post.cover}
          alt=''
          fill
          priority
          className='object-cover'
          sizes='100vw'
        />
        <div className='absolute inset-0 bg-zinc-950/35' />
        <div className='absolute top-6 left-4 md:left-8'>
          <Link
            href={blogPrototypeHref('/blog', variant)}
            className='rounded-full bg-white/90 px-4 py-2 text-sm text-slate-900 backdrop-blur transition hover:bg-white'
          >
            ← Insights
          </Link>
        </div>
      </div>

      <div className='container mx-auto max-w-3xl px-4 py-14 md:px-8'>
        <p className='text-sm tracking-[0.18em] text-slate-500 uppercase'>
          {formatPrototypeDate(post.publishedAt)}
        </p>
        <h1 className='mt-4 text-4xl font-semibold text-balance md:text-5xl'>
          {post.title}
        </h1>
        <p className='mt-6 text-xl text-slate-600 text-pretty dark:text-slate-300'>
          {post.excerpt}
        </p>
        <div className='mt-8 flex items-center gap-3'>
          {post.author.image ? (
            <Image
              src={post.author.image}
              alt=''
              width={44}
              height={44}
              className='size-11 rounded-full object-cover'
            />
          ) : null}
          <div>
            <p className='font-medium'>{post.author.name}</p>
            {post.author.role ? (
              <p className='text-sm text-slate-500'>{post.author.role}</p>
            ) : null}
          </div>
        </div>
        <BodyBlocks
          blocks={post.body}
          className='mt-12 space-y-10 [&_figure]:-mx-4 md:[&_figure]:mx-0 md:[&_figure_.aspect-video]:aspect-[4/3]'
        />
      </div>
    </article>
  )
}
