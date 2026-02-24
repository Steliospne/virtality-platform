export type Plan = (typeof plans)[number] & {
  name: 'basic' | 'pro' | 'enterprise'
}

export const plans = [
  {
    name: 'basic',
    description: 'Perfect for single clinicians',
    monthlyPrice: 49,
    annualPrice: 39, // 17% discount
    period: { annual: 'per month, billed annually', monthly: 'per month' },
    features: [
      '3 programs per patient',
      'Up to 50 patients',
      '30 days data retention',
      '100+ exercises',
      'Basic reporting',
      'Email support',
    ],
    buttonText: 'Start Basic',
    popular: false,
  },
  {
    name: 'Pro',
    description: 'Ideal for small to medium-sized clinics',
    monthlyPrice: 79,
    annualPrice: 65, // 18% discount
    period: { annual: 'per month, billed annually', monthly: 'per month' },
    features: [
      '10 programs per patient',
      'Up to 200 patients',
      '90 days data retention',
      '500+ exercises',
      'Advanced reporting',
      'Priority support',
      'Team collaboration',
    ],
    buttonText: 'Start Value',
    popular: true,
  },
  {
    name: 'Enterprise',
    description: 'Built for big clinics and hospitals',
    monthlyPrice: 199,
    annualPrice: 159, // 20% discount
    period: { annual: 'per month, billed annually', monthly: 'per month' },
    features: [
      'Unlimited programs per patient',
      'Unlimited patients',
      '1 year data retention',
      '1000+ exercises',
      'Enterprise reporting',
      '24/7 phone support',
      'Advanced integrations',
      'Custom workflows',
    ],
    buttonText: 'Contact Sales',
    popular: false,
  },
]
