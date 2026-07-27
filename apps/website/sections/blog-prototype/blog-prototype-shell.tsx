/**
 * PROTOTYPE — four radically different blog index/post look-and-feel variants.
 * Switch via ?variant=A|B|C|D (floating bar + arrow keys). Throwaway; not production.
 */

import { Suspense } from 'react'
import type { BlogPrototypeVariantKey, ResolvedPost } from './types'
import PrototypeSwitcher from './components/prototype-switcher'
import { VariantAIndex, VariantAPost } from './variants/a-spotlight'
import { VariantBIndex, VariantBPost } from './variants/b-rail'
import { VariantCIndex, VariantCPost } from './variants/c-mosaic'
import { VariantDIndex, VariantDPost } from './variants/d-essay'

type IndexShellProps = {
  posts: ResolvedPost[]
  featured: ResolvedPost | undefined
  variant: BlogPrototypeVariantKey
}

type PostShellProps = {
  post: ResolvedPost
  variant: BlogPrototypeVariantKey
}

export const BlogPrototypeIndex = ({
  posts,
  featured,
  variant,
}: IndexShellProps) => {
  return (
    <>
      {variant === 'A' ? (
        <VariantAIndex posts={posts} featured={featured} variant={variant} />
      ) : null}
      {variant === 'B' ? (
        <VariantBIndex posts={posts} featured={featured} variant={variant} />
      ) : null}
      {variant === 'C' ? (
        <VariantCIndex posts={posts} featured={featured} variant={variant} />
      ) : null}
      {variant === 'D' ? (
        <VariantDIndex posts={posts} featured={featured} variant={variant} />
      ) : null}
      <Suspense fallback={null}>
        <PrototypeSwitcher />
      </Suspense>
    </>
  )
}

export const BlogPrototypePost = ({ post, variant }: PostShellProps) => {
  return (
    <>
      {variant === 'A' ? <VariantAPost post={post} variant={variant} /> : null}
      {variant === 'B' ? <VariantBPost post={post} variant={variant} /> : null}
      {variant === 'C' ? <VariantCPost post={post} variant={variant} /> : null}
      {variant === 'D' ? <VariantDPost post={post} variant={variant} /> : null}
      <Suspense fallback={null}>
        <PrototypeSwitcher />
      </Suspense>
    </>
  )
}
