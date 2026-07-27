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
