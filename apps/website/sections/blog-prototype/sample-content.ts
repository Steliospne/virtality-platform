/**
 * PROTOTYPE sample content — English posts against the locked schema.
 * Not production content; the live Greek/HTML conference post is ignored.
 */

import type { Author, Post, ResolvedPost } from './types'

export const PROTOTYPE_AUTHORS: Author[] = [
  {
    id: 'katerina-tsiraki',
    name: 'Katerina Tsiraki',
    role: 'Cognitive Engineer',
    image: '/kate_auth_img.jpg',
  },
]

const kate = PROTOTYPE_AUTHORS[0]!

export const PROTOTYPE_POSTS: Post[] = [
  {
    slug: 'rewiring-recovery',
    title: 'Rewiring recovery: how VR engages neuroplasticity',
    excerpt:
      'Immersive therapy is not a gadget layer on top of rehab — it is a way to recruit the brain’s capacity to relearn movement, attention, and confidence.',
    cover: '/conf_img.png',
    authorId: kate.id,
    publishedAt: '2025-09-19',
    featured: true,
    body: [
      {
        kind: 'paragraph',
        text: 'Physical recovery is never only a matter of muscles and joints. Every intentional movement is also a cognitive and sensory event: the brain predicts, corrects, and consolidates. When clinics can shape those predictions inside a controlled environment, practice becomes more precise — and often more motivating.',
      },
      {
        kind: 'paragraph',
        text: 'Virtual reality gives therapists levers that the physical room rarely offers. You can scale difficulty without changing equipment, cue attention without verbal overload, and keep a session engaging when repetition would otherwise flatten effort. Patients rehearse meaningful tasks while the system captures how they move.',
      },
      {
        kind: 'image',
        src: 'https://cdn.virtality.app/2e78ac55ab9e56ef44091705aabeced201df5db4e6c6a92b2133ca556a93bbee',
        alt: 'Patient using a VR headset during a rehabilitation session',
        caption:
          'Practice that feels purposeful keeps patients inside the therapeutic window longer.',
      },
      {
        kind: 'paragraph',
        text: 'Neuroplasticity is the mechanism underneath that progress. Repeated, salient, and progressively challenging experiences reshape the circuits that support motor control. Immersive scenes make those experiences vivid enough that the brain treats them as worth encoding — even when the body is still rebuilding capacity.',
      },
      {
        kind: 'video',
        source: 'youtube',
        url: 'https://www.youtube.com/watch?v=DibqL9OdsBw',
        caption:
          'A short look at interactive technology for sports-injury rehabilitation.',
      },
      {
        kind: 'paragraph',
        text: 'The practical takeaway for clinics is simple: treat VR as part of the clinical plan, not a novelty demo. Pair it with clear goals, measurable progression, and continuity between in-clinic sessions and home practice. When mind and body train together, recovery stops being a sequence of isolated exercises and starts looking like genuine relearning.',
      },
    ],
  },
  {
    slug: 'movement-cues-patients-follow',
    title: 'Designing movement cues patients actually follow',
    excerpt:
      'Instructions fail when they compete with pain, fear, or cognitive load. Better cues are sparse, spatial, and timed to the movement itself.',
    cover: '/hero/ManNeuralFlipped-poster.jpg',
    authorId: kate.id,
    publishedAt: '2025-11-03',
    featured: false,
    body: [
      {
        kind: 'paragraph',
        text: 'Ask a patient to “keep the knee tracking over the toes” while they are already managing balance, fatigue, and uncertainty — and the cue often vanishes. Clinical language is precise for therapists; it is rarely the right bandwidth for someone mid-rep.',
      },
      {
        kind: 'paragraph',
        text: 'Immersive environments can externalize the cue. A target appears where the reach should land. A pathway brightens when alignment is good. Feedback arrives at the moment of action instead of as a lecture afterward. The patient does less translating and more doing.',
      },
      {
        kind: 'image',
        src: '/site_front.png',
        alt: 'Virtality product interface shown beside clinical context',
        caption:
          'Spatial cues reduce how much verbal instruction a session needs.',
      },
      {
        kind: 'paragraph',
        text: 'Good cue design is still clinical judgment. Too many signals create noise; too few leave patients guessing. The sweet spot is a single dominant cue per phase of the movement, with the rest of the scene staying quiet enough that attention has somewhere to land.',
      },
    ],
  },
  {
    slug: 'questions-before-immersive-rehab',
    title: 'What clinics ask before adopting immersive rehab',
    excerpt:
      'Before the headset comes out of the box, teams want clarity on workflow, measurement, staff confidence, and what “better outcomes” will look like in their rooms.',
    cover:
      'https://cdn.virtality.app/2e78ac55ab9e56ef44091705aabeced201df5db4e6c6a92b2133ca556a93bbee',
    authorId: kate.id,
    publishedAt: '2026-01-14',
    featured: false,
    body: [
      {
        kind: 'paragraph',
        text: 'Most adoption conversations do not start with graphics fidelity. They start with the calendar: who runs the session, how long setup takes, and whether the tool fits between existing modalities instead of displacing them.',
      },
      {
        kind: 'paragraph',
        text: 'The second cluster of questions is about evidence and measurement. Clinics want to know what changes in adherence, pain tolerance, functional scores, or engagement — and how those signals show up without inventing a second documentation habit.',
      },
      {
        kind: 'paragraph',
        text: 'Staff confidence closes the loop. A system that only one enthusiast can run will stall. Training, preset programs, and clear progression paths matter as much as the immersive content itself. Technology earns its place when ordinary sessions become more consistent, not when demos look impressive.',
      },
    ],
  },
  {
    slug: 'headset-to-home',
    title: 'From headset to home: continuity after the clinic visit',
    excerpt:
      'Gains fade when practice stops at the door. Continuity means the same therapeutic intent travels home in a form patients can actually complete.',
    cover: '/site_front.png',
    authorId: kate.id,
    publishedAt: '2026-03-02',
    featured: false,
    body: [
      {
        kind: 'paragraph',
        text: 'In-clinic intensity is only half the story. The days between visits decide whether skill consolidates or slips. Home programs fail for ordinary reasons: unclear instructions, low feedback, and tasks that feel disconnected from the progress patients felt in session.',
      },
      {
        kind: 'paragraph',
        text: 'Continuity is not “do more exercises.” It is preserving the same goal structure with a lighter footprint — shorter bouts, clearer success criteria, and a way for clinicians to see what happened without turning patients into data clerks.',
      },
      {
        kind: 'video',
        source: 'cdn',
        url: '/hero/ManNeuralFlipped-loop.mp4',
        caption:
          'Ambient motion from the product world — a stand-in for at-home guided practice media.',
      },
      {
        kind: 'paragraph',
        text: 'When clinic and home share a language of tasks and cues, patients stop switching contexts every time they leave the building. That continuity is often the difference between a promising session and a durable recovery arc.',
      },
    ],
  },
]

export function getPrototypeAuthor(authorId: string): Author {
  const author = PROTOTYPE_AUTHORS.find((entry) => entry.id === authorId)
  if (!author) {
    throw new Error(`Unknown prototype author: ${authorId}`)
  }
  return author
}

export function resolvePrototypePost(post: Post): ResolvedPost {
  return {
    ...post,
    author: getPrototypeAuthor(post.authorId),
  }
}

export function getPrototypePosts(): ResolvedPost[] {
  return PROTOTYPE_POSTS.map(resolvePrototypePost).sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  )
}

export function getPrototypePostBySlug(slug: string): ResolvedPost | undefined {
  const post = PROTOTYPE_POSTS.find((entry) => entry.slug === slug)
  return post ? resolvePrototypePost(post) : undefined
}

export function getFeaturedPrototypePost(): ResolvedPost | undefined {
  return getPrototypePosts().find((post) => post.featured)
}
