/** PROTOTYPE — throwaway types matching the locked blog content model. */

export type Author = {
  id: string
  name: string
  role?: string
  image?: string
}

export type ParagraphBlock = {
  kind: 'paragraph'
  text: string
}

export type ImageBlock = {
  kind: 'image'
  src: string
  alt: string
  caption?: string
}

export type VideoBlock = {
  kind: 'video'
  source: 'cdn' | 'youtube'
  url: string
  caption?: string
}

export type BodyBlock = ParagraphBlock | ImageBlock | VideoBlock

export type Post = {
  slug: string
  title: string
  excerpt: string
  cover: string
  authorId: string
  publishedAt: string
  featured: boolean
  body: BodyBlock[]
}

export type ResolvedPost = Post & {
  author: Author
}

export const BLOG_PROTOTYPE_VARIANTS = [
  {
    key: 'A',
    name: 'Spotlight stack',
  },
  {
    key: 'B',
    name: 'Meta rail',
  },
  {
    key: 'C',
    name: 'Cover mosaic',
  },
  {
    key: 'D',
    name: 'Quiet essay',
  },
] as const

export type BlogPrototypeVariantKey =
  (typeof BLOG_PROTOTYPE_VARIANTS)[number]['key']
