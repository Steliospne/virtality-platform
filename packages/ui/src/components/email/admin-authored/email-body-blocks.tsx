import {
  Button,
  Container,
  Heading,
  Hr,
  Img,
  Link,
  Section,
  Text,
} from '@react-email/components'
import {
  button,
  buttonContainer,
  card,
  divider,
  paragraph,
  sectionHeading,
  listItem,
} from '../styles/email.js'

type EmailHeadingBlock = {
  type: 'heading'
  id: string
  text: string
  level: 1 | 2 | 3
}

type EmailParagraphBlock = {
  type: 'paragraph'
  id: string
  text: string
}

type EmailImageBlock = {
  type: 'image'
  id: string
  objectKey: string
  alt: string
}

type EmailButtonBlock = {
  type: 'button'
  id: string
  label: string
  href: string
}

type EmailListBlock = {
  type: 'list'
  id: string
  items: string[]
  ordered: boolean
}

type EmailCardBlock = {
  type: 'card'
  id: string
  heading?: string
  body?: string
  imageObjectKey?: string
  imageAlt?: string
  buttonLabel?: string
  buttonHref?: string
}

type EmailDividerBlock = {
  type: 'divider'
  id: string
}

export type AdminEmailBodyBlock =
  | EmailHeadingBlock
  | EmailParagraphBlock
  | EmailImageBlock
  | EmailButtonBlock
  | EmailListBlock
  | EmailCardBlock
  | EmailDividerBlock

const bucketCdnUrl = (objectKey: string) => {
  const baseUrl = process.env.CDN_URL
  if (!baseUrl) {
    throw new Error('CDN_URL environment variable is required')
  }

  return `${baseUrl}/${objectKey}`
}

const headingStyleForLevel = (level: 1 | 2 | 3) => {
  if (level === 1) {
    return {
      ...sectionHeading,
      fontSize: '28px',
      marginTop: '0',
    }
  }

  if (level === 3) {
    return {
      ...sectionHeading,
      fontSize: '18px',
    }
  }

  return sectionHeading
}

const renderBlock = (block: AdminEmailBodyBlock) => {
  switch (block.type) {
    case 'heading':
      return (
        <Heading
          key={block.id}
          className='heading-section'
          style={headingStyleForLevel(block.level)}
        >
          {block.text}
        </Heading>
      )
    case 'paragraph':
      return (
        <Text key={block.id} style={paragraph}>
          {block.text}
        </Text>
      )
    case 'image':
      return (
        <Section key={block.id}>
          <Img
            src={bucketCdnUrl(block.objectKey)}
            alt={block.alt}
            width='100%'
            style={{ borderRadius: '6px', marginBottom: '16px' }}
          />
        </Section>
      )
    case 'button':
      return (
        <Section key={block.id} style={buttonContainer}>
          <Button href={block.href} style={button}>
            {block.label}
          </Button>
        </Section>
      )
    case 'list': {
      const ListTag = block.ordered ? 'ol' : 'ul'
      return (
        <Section key={block.id} style={{ marginBottom: '16px' }}>
          <ListTag style={{ margin: 0, paddingLeft: '20px' }}>
            {block.items.map((item, index) => (
              <li key={`${block.id}-${index}`} style={listItem}>
                {item}
              </li>
            ))}
          </ListTag>
        </Section>
      )
    }
    case 'card':
      return (
        <Section key={block.id} style={card}>
          {block.heading ? (
            <Heading style={{ ...sectionHeading, marginTop: 0 }}>
              {block.heading}
            </Heading>
          ) : null}
          {block.body ? <Text style={paragraph}>{block.body}</Text> : null}
          {block.imageObjectKey && block.imageAlt ? (
            <Img
              src={bucketCdnUrl(block.imageObjectKey)}
              alt={block.imageAlt}
              width='100%'
              style={{ borderRadius: '6px', marginBottom: '16px' }}
            />
          ) : null}
          {block.buttonLabel && block.buttonHref ? (
            <Section style={{ ...buttonContainer, margin: '16px 0 0' }}>
              <Link href={block.buttonHref} style={button}>
                {block.buttonLabel}
              </Link>
            </Section>
          ) : null}
        </Section>
      )
    case 'divider':
      return <Hr key={block.id} style={divider} />
  }
}

interface EmailBodyBlocksProps {
  blocks: AdminEmailBodyBlock[]
}

export const EmailBodyBlocks = ({ blocks }: EmailBodyBlocksProps) => {
  return (
    <Container style={{ padding: '40px' }}>{blocks.map(renderBlock)}</Container>
  )
}
