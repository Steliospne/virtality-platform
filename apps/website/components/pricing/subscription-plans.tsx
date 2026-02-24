'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Check } from 'lucide-react'
import { useState } from 'react'
import { plans } from '@/data/plans'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default function SubscriptionPlans() {
  const [isAnnual, setIsAnnual] = useState(false)

  const calculateSavings = (monthly: number, annual: number) => {
    const monthlyCost = monthly * 12
    const annualCost = annual * 12
    const savings = monthlyCost - annualCost
    const percentage = Math.round((savings / monthlyCost) * 100)
    return { savings, percentage }
  }

  return (
    <div className='w-full max-w-6xl mx-auto p-6'>
      <div className='text-center mb-12'>
        <h2 className='text-3xl font-bold tracking-tight mb-4'>
          Choose Your Plan
        </h2>
        <p className='text-lg text-muted-foreground mb-8'>
          Select the perfect plan for your practice size and needs
        </p>

        {/* Billing Toggle */}
        <div className='flex items-center justify-center gap-4 mb-2'>
          <Label
            htmlFor='billing-toggle'
            className={cn(
              'text-sm font-medium',
              !isAnnual ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            Monthly
          </Label>
          <Switch
            id='billing-toggle'
            checked={isAnnual}
            onCheckedChange={setIsAnnual}
            className='data-[state=checked]:bg-vital-blue-700'
          />
          <Label
            htmlFor='billing-toggle'
            className={cn(
              'text-sm font-medium',
              isAnnual ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            Annual
          </Label>
        </div>
        {isAnnual && (
          <p className='text-sm text-vital-blue-700 font-medium'>
            Save up to 20% with annual billing!
          </p>
        )}
      </div>

      <div className='grid md:grid-cols-3 gap-8'>
        {plans.map((plan, planIndex) => {
          const currentPrice = isAnnual ? plan.annualPrice : plan.monthlyPrice
          const savings = isAnnual
            ? calculateSavings(plan.monthlyPrice, plan.annualPrice)
            : null

          return (
            <Card
              key={plan.name}
              className={cn(
                'relative',
                plan.popular
                  ? 'border-vital-blue-700 shadow-lg scale-105'
                  : 'border-border',
              )}
            >
              {plan.popular && (
                <Badge className='absolute -top-3 left-1/2 transform -translate-x-1/2 bg-vital-blue-700 text-foreground'>
                  Most Popular
                </Badge>
              )}

              <CardHeader className='text-center pb-8'>
                <CardTitle className='text-2xl font-bold'>
                  {plan.name}
                </CardTitle>
                <CardDescription className='text-base'>
                  {plan.description}
                </CardDescription>
                <div className='mt-4'>
                  <div className='flex items-center justify-center gap-2'>
                    <span className='text-4xl font-bold'>€{currentPrice}</span>
                    {isAnnual && (
                      <span className='text-lg text-muted-foreground line-through'>
                        €{plan.monthlyPrice}
                      </span>
                    )}
                  </div>
                  <span className='text-muted-foreground text-sm'>
                    {isAnnual ? plan.period.annual : plan.period.monthly}
                  </span>
                  {isAnnual && savings && (
                    <div className='mt-2'>
                      <Badge variant='secondary' className='text-xs'>
                        Save €{savings.savings}/year ({savings.percentage}% off)
                      </Badge>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className='space-y-4'>
                <ul className='space-y-3'>
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className='flex items-start gap-3'>
                      <Check className='h-5 w-5 text-vital-blue-700 mt-0.5 flex-shrink-0' />
                      <span className='text-sm'>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  asChild
                  variant={plan.popular ? 'primary' : 'outline'}
                  className='w-full'
                >
                  <Link href={`/waitlist?plan=${planIndex}`}>Select Plan</Link>
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <div className='text-center mt-12'>
        <p className='text-sm text-muted-foreground'>
          All plans include SSL security, regular backups, and HIPAA compliance
        </p>
        {isAnnual && (
          <p className='text-sm text-muted-foreground mt-2'>
            Annual plans are billed once per year. Cancel anytime.
          </p>
        )}
      </div>
    </div>
  )
}
