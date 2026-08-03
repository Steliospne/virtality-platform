export type BenefitsListItem = {
  title: string
  description: string
}

export const BENEFITS_SECTION_CONTENT = {
  eyebrow: 'Why clinics choose Virtality',
  titleLead: 'Practical problems,',
  titleAccent: 'solved in clinics.',
  intro:
    'Built for private clinic owners and lead physiotherapists who prioritize active recovery over passive symptom relief, without adding operational friction.',
} as const

export const BENEFITS_LIST_ITEMS: BenefitsListItem[] = [
  {
    title: 'Faster Recovery Timelines',
    description:
      'Help patients move past stalled progress. In pilot cases, Virtality restored end-range motion in as few as two targeted sessions even when rehabilitation had shown little to no progress for months.',
  },
  {
    title: 'Increase Clinic Capacity',
    description:
      'Let patients continue guided VR exercises while therapists focus on those who need hands-on care. Treat more patients without increasing staff or compromising quality of care.',
  },
  {
    title: 'Keep Patients on Track',
    description:
      'Turn repetitive or intimidating exercises into engaging, achievable experiences. Patients stay motivated, follow their treatment plans, and are more likely to complete their rehabilitation.',
  },
  {
    title: 'Stand Out from Other Clinics',
    description:
      'Help every patient build better, higher-level movement skills. By bypassing pain fear and stopping muscle compensation, Virtality retrains the brain directly accelerating neuroplasticity across all stages of rehab to give your clinic an unbeatable edge. ',
  },
]
