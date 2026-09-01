export type HighlightCardCollection = 'benefits' | 'features'

export type MarketingHighlightCardSeedContent = {
  title: string
  body: string
  iconName: string
}

export type MarketingHighlightCardSeedRecord =
  MarketingHighlightCardSeedContent & {
    id: string
    collection: HighlightCardCollection
    sortOrder: number
  }

const HIGHLIGHT_CARD_COLLECTIONS = [
  'benefits',
  'features',
] as const satisfies readonly HighlightCardCollection[]

const EXPECTED_COUNT_PER_COLLECTION = 6

const BENEFITS_SEED_IDS = [
  'c3f8e2a1-4b5c-4d6e-8f70-000000000001',
  'c3f8e2a1-4b5c-4d6e-8f70-000000000002',
  'c3f8e2a1-4b5c-4d6e-8f70-000000000003',
  'c3f8e2a1-4b5c-4d6e-8f70-000000000004',
  'c3f8e2a1-4b5c-4d6e-8f70-000000000005',
  'c3f8e2a1-4b5c-4d6e-8f70-000000000006',
] as const

const FEATURES_SEED_IDS = [
  'd4a9f3b2-5c6d-4e7f-9a81-000000000001',
  'd4a9f3b2-5c6d-4e7f-9a81-000000000002',
  'd4a9f3b2-5c6d-4e7f-9a81-000000000003',
  'd4a9f3b2-5c6d-4e7f-9a81-000000000004',
  'd4a9f3b2-5c6d-4e7f-9a81-000000000005',
  'd4a9f3b2-5c6d-4e7f-9a81-000000000006',
] as const

const BENEFITS_SEED_CONTENT = [
  {
    title: 'Help patients follow guided movement again',
    body: 'Patients who resist or avoid exercise can start participating in clinician-guided VR sessions instead of sitting out.',
    iconName: 'PersonStanding',
  },
  {
    title: 'Support fearful and guarded movement patterns',
    body: 'Virtality can support patients facing kinesiophobia, chronic pain, fibromyalgia, and tendinopathy by reducing fear and improving guided movement—without claiming to treat those conditions directly.',
    iconName: 'Shield',
  },
  {
    title: 'Free you to see more patients in the same hour',
    body: 'A patient can continue a guided VR session while you step away to assess or treat someone else.',
    iconName: 'Users',
  },
  {
    title: 'Keep patients engaged between hands-on visits',
    body: 'When motivation drops mid-program, immersive guided exercises help patients stay with their plan between appointments.',
    iconName: 'Sparkles',
  },
  {
    title: 'Ground decisions in session-level insight',
    body: 'Progress from each session gives physiotherapists concrete signals to adjust guided movement before the next visit.',
    iconName: 'ClipboardList',
  },
  {
    title: 'Built for private clinic realities',
    body: 'From lead physiotherapists to clinic owners, Virtality fits workflows where time, staffing, and throughput shape every treatment decision.',
    iconName: 'Building2',
  },
] as const satisfies readonly MarketingHighlightCardSeedContent[]

const FEATURES_SEED_CONTENT = [
  {
    title: 'Real-time Biofeedback',
    body: 'Monitor patient progress in real time, visualize movement patterns, identify areas of improvement, and adapt therapy plans based on measurable performance insights.',
    iconName: 'Activity',
  },
  {
    title: 'Neuroplasticity Exercises',
    body: 'Specialized VR environments designed to stimulate neural pathways, accelerate recovery, and optimize outcomes through targeted exercises.',
    iconName: 'Brain',
  },
  {
    title: 'Quick setup, equipment included',
    body: 'Get started in under 40 seconds with no extra cameras, sensors, cables, or calibration. Equipment is provided so your clinic can begin guided VR sessions without sourcing hardware.',
    iconName: 'Package',
  },
  {
    title: 'Progress Analytics',
    body: 'Built-in analytics track key recovery metrics and generate clear, actionable reports to support decision-making.',
    iconName: 'BarChartBig',
  },
  {
    title: 'Customizable Therapy',
    body: 'Create personalized treatment plans with flexible, inclusive tools that adapt to each patient’s individual needs.',
    iconName: 'Sliders',
  },
  {
    title: 'Engagement Tracking',
    body: 'Monitor patient engagement and adherence to prescribed exercises to ensure optimal therapeutic outcomes.',
    iconName: 'Clock',
  },
] as const satisfies readonly MarketingHighlightCardSeedContent[]

function buildCollectionSeed(
  collection: HighlightCardCollection,
  ids: readonly string[],
  content: readonly MarketingHighlightCardSeedContent[],
): MarketingHighlightCardSeedRecord[] {
  return content.map((item, index) => ({
    id: ids[index]!,
    collection,
    title: item.title,
    body: item.body,
    iconName: item.iconName,
    sortOrder: index,
  }))
}

export const MARKETING_HIGHLIGHT_CARD_SEED: MarketingHighlightCardSeedRecord[] =
  [
    ...buildCollectionSeed(
      'benefits',
      BENEFITS_SEED_IDS,
      BENEFITS_SEED_CONTENT,
    ),
    ...buildCollectionSeed(
      'features',
      FEATURES_SEED_IDS,
      FEATURES_SEED_CONTENT,
    ),
  ]

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function validateCollectionRecords(
  collection: HighlightCardCollection,
  collectionRecords: MarketingHighlightCardSeedRecord[],
): void {
  if (collectionRecords.length !== EXPECTED_COUNT_PER_COLLECTION) {
    throw new Error(
      `Expected ${EXPECTED_COUNT_PER_COLLECTION} ${collection} highlight cards, received ${collectionRecords.length}`,
    )
  }

  collectionRecords.forEach((record, index) => {
    if (record.sortOrder !== index) {
      throw new Error(
        `Expected ${collection} sortOrder ${index}, received ${record.sortOrder}`,
      )
    }

    if (!UUID_PATTERN.test(record.id)) {
      throw new Error(`Expected stable UUID id for ${collection} card ${index}`)
    }

    if (
      !record.title.trim() ||
      !record.body.trim() ||
      !record.iconName.trim()
    ) {
      throw new Error(
        `Expected title, body, and iconName for ${collection} card ${index}`,
      )
    }
  })
}

export function validateMarketingHighlightCardSeed(
  records: MarketingHighlightCardSeedRecord[],
): void {
  for (const collection of HIGHLIGHT_CARD_COLLECTIONS) {
    const collectionRecords = records
      .filter((record) => record.collection === collection)
      .sort((left, right) => left.sortOrder - right.sortOrder)

    validateCollectionRecords(collection, collectionRecords)
  }

  const ids = new Set(records.map((record) => record.id))
  if (ids.size !== records.length) {
    throw new Error('Expected unique highlight card seed ids')
  }
}

validateMarketingHighlightCardSeed(MARKETING_HIGHLIGHT_CARD_SEED)

function escapeSqlString(value: string): string {
  return value.replaceAll("'", "''")
}

function formatSeedInsertValue(
  record: MarketingHighlightCardSeedRecord,
): string {
  return `('${record.id}', '${record.collection}', '${escapeSqlString(record.title)}', '${escapeSqlString(record.body)}', '${escapeSqlString(record.iconName)}', ${record.sortOrder}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
}

export function buildMarketingHighlightCardSeedSql(
  records: MarketingHighlightCardSeedRecord[] = MARKETING_HIGHLIGHT_CARD_SEED,
): string {
  validateMarketingHighlightCardSeed(records)

  const values = records.map(formatSeedInsertValue).join(',\n    ')

  return `INSERT INTO "MarketingHighlightCard" ("id", "collection", "title", "body", "iconName", "sortOrder", "createdAt", "updatedAt")\nVALUES\n    ${values};`
}
