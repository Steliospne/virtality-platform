'use client'
import Joyride, { Props } from '@virtality/react-joyride'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { TooltipRenderProps } from '@virtality/react-joyride'
import useMounted from '@/hooks/use-mounted'

export default function JoyrideWrapper(props: Props) {
  const mounted = useMounted()

  if (!mounted) return null

  return <Joyride {...props} tooltipComponent={CustomTooltip} />
}

function CustomTooltip({
  step,
  tooltipProps,
  primaryProps,
  skipProps,
  closeProps,
  isLastStep,
}: TooltipRenderProps) {
  return (
    <div {...tooltipProps} className='z-[9999] max-w-sm'>
      <style>{`body{pointer-events: all !important;}`}</style>
      <Card className='border-border border shadow-xl'>
        {step?.title && (
          <CardHeader>
            <CardTitle className='text-lg font-semibold'>
              {step.title}
            </CardTitle>
            {step.data?.description && (
              <CardDescription>{step.data.description}</CardDescription>
            )}
          </CardHeader>
        )}
        <CardContent className='space-y-4 p-4'>
          {step.content && <>{step.content}</>}

          <div className='flex justify-end gap-2 pt-2'>
            {skipProps && (
              <Button
                variant='ghost'
                size='sm'
                {...skipProps}
                className='text-muted-foreground'
              >
                Skip
              </Button>
            )}
            {!isLastStep && (
              <Button size='sm' {...primaryProps}>
                {step.locale.next ? step.locale.next : primaryProps.title}
              </Button>
            )}
            {isLastStep && (
              <Button size='sm' {...closeProps}>
                {step.locale.last ? step.locale.last : closeProps.title}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
