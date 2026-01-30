export type CreditPackage = {
  id: string
  name: string
  credits: number
  price: number // in cents
  priceDisplay: string
  type: 'trial' | 'subscription' | 'upgrade'
  interval?: 'month' | 'year'
  trialDays?: number
  description: string
  features?: string[]
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'trial-subscription',
    name: 'Family Keepsake Trial',
    credits: 5,
    price: 799, // $7.99
    priceDisplay: '$7.99',
    type: 'trial',
    interval: 'month',
    trialDays: 15,
    description: '15-day trial, then $14.99/month',
    features: [
      '5 coloring page credits to start',
      '15-day trial period',
      'After trial: $14.99/month for 10 credits',
      'Cancel anytime'
    ]
  },
  {
    id: 'credits-5',
    name: 'Extra Credits',
    credits: 5,
    price: 799, // $7.99
    priceDisplay: '$7.99',
    type: 'trial',
    description: 'One-time purchase - 5 credits',
    features: [
      '5 coloring page credits',
      'One-time payment',
      'No subscription',
      'Credits never expire'
    ]
  }
]

export function getPackageById(id: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find(pkg => pkg.id === id)
}

export function calculatePricePerCredit(price: number, credits: number): string {
  const perCredit = price / credits / 100
  return perCredit.toFixed(2)
}

export function getTrialPackage(): CreditPackage {
  return CREDIT_PACKAGES[0] // extra credits package
}

export function getMonthlySubscription(): CreditPackage | undefined {
  // Subscription packages removed - only one-time credits available
  return undefined
}

export function getPremiumAnnual(): CreditPackage | undefined {
  // Annual package removed - only one-time credits available
  return undefined
}
