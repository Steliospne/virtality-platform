export type CredibilitySectionContent = {
  titleLead: string
  titleAccent: string
  intro: string
}

export type CredibilityLogoItem = {
  src: string
  alt: string
  className?: string
  wide?: boolean
  compact?: boolean
}

export type PressLogoItem = CredibilityLogoItem & {
  href?: string
}

export const SUPPORTED_BY_CONTENT = {
  titleLead: 'Supported',
  titleAccent: 'By',
  intro:
    'Our innovation is backed by leading institutions and trusted by forward-thinking clinics.',
  strategicPartnersLabel: 'Strategic Partnership',
  clinicalPartnersLabel: 'Clinical Partners',
} as const

export const PRESS_SECTION_CONTENT = {
  titleLead: 'Press',
  titleAccent: 'Coverage',
  intro: '',
} as const

export const PRESS_LOGO_ITEMS: PressLogoItem[] = [
  {
    src: '/press/kathimerini-logo.png',
    alt: 'Kathimerini',
    href: 'https://www.ekathimerini.com/economy/1300194/crete-proves-fertile-ground-for-innovation/',
    wide: true,
  },
  {
    src: '/press/anatolh-logo.png',
    alt: 'Anatolh',
    href: 'https://www.anatolh.com/featured/vitality-allazei-to-mellon-tis-fysikotherapeias-meso-eikonikis-pragmatikotitas-kai-me-afetiria-ton-ag-nikolao/',
    wide: true,
  },
  {
    src: '/press/bizrupt-logo.png',
    alt: 'Bizrupt',
    href: 'https://bizrupt.gr/6-anerhomenes-startups-stin-kriti/',
  },
  {
    src: '/press/startupper-logo.png',
    alt: 'Startupper',
    href: 'https://startupper.gr/news/223504/piraeus-startup-accelerator-aftes-einai-oi-10-omades-tou-protou-kyklou/',
    wide: true,
  },
  {
    src: '/press/beyondexpo-logo.png',
    alt: 'Beyond Expo',
    href: 'https://www.livemedia.gr/video/614292',
    wide: true,
  },
  {
    src: '/press/delphi-logo.png',
    alt: 'Delphi Economic Forum',
    href: 'https://www.youtube.com/watch?v=44ds6YdtTuA',
  },
  {
    src: '/press/ionian-logo.png',
    alt: 'Ionian',
    href: 'https://www.youtube.com/live/qbViIQjOUNo?si=Fj1SgXpp0Bi74LKd&t=3685',
    wide: true,
  },
  {
    src: '/press/ena-channel-kavala-logo.png',
    alt: 'Ena Channel Kavala',
    href: 'https://youtu.be/LSxk7x2QZJw?si=ACf_05SeX39G_fFk&t=348',
    wide: true,
    compact: true,
    className: 'h-6 md:h-8',
  },
  {
    src: '/press/hec-paris-logo.png',
    alt: 'HEC Paris',
    href: 'https://www.hec.edu/en/innovation-entrepreneurship-institute/news/we4g-2026-meet-10-finalists',
    wide: true,
    compact: true,
    className: 'h-6 md:h-8',
  },
  {
    src: '/press/elculture-logo.png',
    alt: 'Elculture',
    href: 'https://www.elculture.gr/i-trapeza-peiraios-sto-delphi-economic-forum-2026-tessera-chronia-equall-oi-thematikes-syzitiseis-kai-ta-kairia-zitimata/',
  },
]
