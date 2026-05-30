'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  AlertTriangle,
  XCircle,
  RefreshCw,
  ChevronDown,
  X,
  Wifi,
  ServerCrash,
  ShieldAlert,
} from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Button } from '@virtality/ui/components/button'

// ─── Variants ────────────────────────────────────────────────────────────────

const errorDisplayVariants = cva('', {
  variants: {
    variant: {
      inline: '',
      banner: '',
      card: '',
      page: '',
    },
  },
  defaultVariants: { variant: 'inline' },
})

// ─── Icon map ─────────────────────────────────────────────────────────────────

const ERROR_ICONS = {
  default: XCircle,
  warning: AlertTriangle,
  network: Wifi,
  server: ServerCrash,
  permission: ShieldAlert,
} as const

type ErrorIconType = keyof typeof ERROR_ICONS

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ErrorDisplayProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof errorDisplayVariants> {
  /** Main error heading */
  title?: string
  /** Descriptive message shown below the title */
  message?: string
  /** Raw error object — shown in a collapsible details panel */
  error?: Error | string | null
  /** Icon style */
  icon?: ErrorIconType
  /** Show a retry / refresh action */
  onRetry?: () => void
  retryLabel?: string
  /** Show a dismiss button (banner / inline only) */
  onDismiss?: () => void
  /** Show a secondary CTA — e.g. "Go back home" */
  action?: {
    label: string
    onClick: () => void
  }
}

// ─── Inline ───────────────────────────────────────────────────────────────────

function InlineError({
  title,
  message,
  icon = 'default',
  onDismiss,
  onRetry,
  retryLabel = 'Retry',
  className,
}: ErrorDisplayProps) {
  const Icon = ERROR_ICONS[icon]
  const text = message ?? title

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      role='alert'
      className={cn(
        'flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700',
        'dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400',
        className,
      )}
    >
      <Icon className='mt-0.5 size-4 shrink-0 text-red-500 dark:text-red-400' />
      <span className='flex-1 leading-snug'>{text}</span>
      <div className='flex items-center gap-1'>
        {onRetry && (
          <button
            type='button'
            onClick={onRetry}
            className='text-xs font-medium text-red-600 underline-offset-2 hover:underline dark:text-red-400'
          >
            {retryLabel}
          </button>
        )}
        {onDismiss && (
          <button
            type='button'
            onClick={onDismiss}
            aria-label='Dismiss error'
            className='rounded p-0.5 hover:bg-red-100 dark:hover:bg-red-900/30'
          >
            <X className='size-3.5' />
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ─── Banner ───────────────────────────────────────────────────────────────────

function BannerError({
  title = 'Something went wrong',
  message,
  icon = 'default',
  onDismiss,
  onRetry,
  retryLabel = 'Try again',
  error,
  className,
}: ErrorDisplayProps) {
  const [expanded, setExpanded] = React.useState(false)
  const Icon = ERROR_ICONS[icon]
  const errorDetails =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : null

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      role='alert'
      className={cn(
        'w-full rounded-lg border border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/30',
        className,
      )}
    >
      <div className='flex items-start gap-3 px-4 py-3'>
        <span className='mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40'>
          <Icon className='size-3 text-red-600 dark:text-red-400' />
        </span>

        <div className='flex-1 space-y-0.5'>
          <p className='text-sm font-medium text-red-800 dark:text-red-300'>
            {title}
          </p>
          {message && (
            <p className='text-xs leading-relaxed text-red-600/80 dark:text-red-400/70'>
              {message}
            </p>
          )}
        </div>

        <div className='flex items-center gap-2'>
          {onRetry && (
            <button
              type='button'
              onClick={onRetry}
              className='flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30'
            >
              <RefreshCw className='size-3' />
              {retryLabel}
            </button>
          )}
          {errorDetails && (
            <button
              type='button'
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className='rounded p-1 text-red-500 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30'
              aria-label='Toggle error details'
            >
              <ChevronDown
                className={cn(
                  'size-4 transition-transform duration-200',
                  expanded && 'rotate-180',
                )}
              />
            </button>
          )}
          {onDismiss && (
            <button
              type='button'
              onClick={onDismiss}
              aria-label='Dismiss'
              className='rounded p-1 text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
            >
              <X className='size-4' />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {expanded && errorDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className='overflow-hidden'
          >
            <div className='border-t border-red-200/70 px-4 py-2 dark:border-red-900/40'>
              <pre className='overflow-x-auto font-mono text-xs text-nowrap text-red-600/70 dark:text-red-400/60'>
                {errorDetails}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function CardError({
  title = 'Failed to load',
  message = 'There was a problem fetching this content.',
  icon = 'server',
  onRetry,
  retryLabel = 'Retry',
  action,
  error,
  className,
}: ErrorDisplayProps) {
  const [expanded, setExpanded] = React.useState(false)
  const Icon = ERROR_ICONS[icon]
  const errorDetails =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      role='alert'
      className={cn(
        'flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white px-6 py-6 text-zinc-950 shadow-sm',
        'dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50',
        className,
      )}
    >
      {/* Icon row */}
      <div className='flex items-start gap-4'>
        <div className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-50 ring-1 ring-red-100 dark:bg-red-950/40 dark:ring-red-900/40'>
          <Icon className='size-5 text-red-500 dark:text-red-400' />
        </div>

        <div className='flex-1 space-y-1'>
          <p className='text-sm font-semibold text-zinc-900 dark:text-zinc-100'>
            {title}
          </p>
          <p className='text-sm text-zinc-500 dark:text-zinc-400'>{message}</p>
        </div>
      </div>

      {/* Actions */}
      {(onRetry || action) && (
        <div className='flex items-center gap-2'>
          {onRetry && (
            <Button
              variant='outline'
              size='sm'
              onClick={onRetry}
              className='gap-1.5 text-xs'
            >
              <RefreshCw className='size-3.5' />
              {retryLabel}
            </Button>
          )}
          {action && (
            <Button
              variant='ghost'
              size='sm'
              onClick={action.onClick}
              className='text-xs text-zinc-500 dark:text-zinc-400'
            >
              {action.label}
            </Button>
          )}
        </div>
      )}

      {/* Expandable details */}
      {errorDetails && (
        <div className='space-y-1'>
          <button
            type='button'
            onClick={() => setExpanded((v) => !v)}
            className='flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
          >
            <ChevronDown
              className={cn(
                'size-3.5 transition-transform duration-200',
                expanded && 'rotate-180',
              )}
            />
            {expanded ? 'Hide' : 'Show'} details
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeInOut' }}
                className='overflow-hidden'
              >
                <pre className='overflow-x-auto rounded-md bg-zinc-50 p-3 font-mono text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-500'>
                  {errorDetails}
                </pre>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}

// ─── Full Page ─────────────────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
  },
}

function PageError({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try refreshing the page.',
  icon = 'default',
  onRetry,
  retryLabel = 'Refresh page',
  action,
  error,
  className,
}: ErrorDisplayProps) {
  const [expanded, setExpanded] = React.useState(false)
  const Icon = ERROR_ICONS[icon]
  const errorDetails =
    error instanceof Error
      ? `${error.name}: ${error.message}${error.stack ? `\n\n${error.stack}` : ''}`
      : typeof error === 'string'
        ? error
        : null

  return (
    <div
      role='alert'
      className={cn(
        'min-h-screen-with-header flex flex-col items-center justify-center px-4',
        className,
      )}
    >
      <motion.div
        className='flex w-full max-w-md flex-col items-center text-center'
        variants={containerVariants}
        initial='hidden'
        animate='visible'
      >
        {/* Decorative icon ring */}
        <motion.div variants={itemVariants} className='relative mb-6'>
          <div className='absolute inset-0 rounded-full bg-red-100/60 blur-xl dark:bg-red-950/60' />
          <div className='relative flex size-20 items-center justify-center rounded-full border border-red-100 bg-red-50 shadow-sm ring-4 ring-red-50 dark:border-red-900/40 dark:bg-red-950/40 dark:ring-red-950/40'>
            <Icon
              className='size-9 text-red-500 dark:text-red-400'
              strokeWidth={1.5}
            />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          variants={itemVariants}
          className='text-h3 text-zinc-900 dark:text-zinc-100'
        >
          {title}
        </motion.h1>

        {/* Message */}
        <motion.p
          variants={itemVariants}
          className='mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400'
        >
          {message}
        </motion.p>

        {/* Vital-blue accent divider */}
        <motion.div
          variants={itemVariants}
          className='via-vital-blue-400 dark:via-vital-blue-600 my-6 h-px w-16 bg-linear-to-r from-transparent to-transparent'
        />

        {/* Actions */}
        <motion.div
          variants={itemVariants}
          className='flex flex-wrap items-center justify-center gap-3'
        >
          {onRetry && (
            <Button onClick={onRetry} variant='outline' className='gap-2'>
              <RefreshCw className='size-4' />
              {retryLabel}
            </Button>
          )}
          {action && (
            <Button
              onClick={action.onClick}
              variant='ghost'
              className='text-zinc-500'
            >
              {action.label}
            </Button>
          )}
        </motion.div>

        {/* Error details toggle */}
        {errorDetails && (
          <motion.div variants={itemVariants} className='mt-6 w-full'>
            <button
              type='button'
              onClick={() => setExpanded((v) => !v)}
              className='flex w-full items-center justify-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
            >
              <ChevronDown
                className={cn(
                  'size-3.5 transition-transform duration-200',
                  expanded && 'rotate-180',
                )}
              />
              {expanded ? 'Hide' : 'View'} error details
            </button>
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                  className='mt-2 overflow-hidden'
                >
                  <pre className='overflow-x-auto rounded-lg border border-zinc-100 bg-zinc-50 p-4 text-left font-mono text-xs leading-relaxed text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500'>
                    {errorDetails}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

// ─── Universal ErrorDisplay ────────────────────────────────────────────────────

/**
 * Universal error display component.
 *
 * @example
 * // Inline — for form-field level errors
 * <ErrorDisplay variant="inline" message="Invalid email address" />
 *
 * @example
 * // Banner — page-level dismissible notice
 * <ErrorDisplay variant="banner" title="Failed to save" message="Changes could not be saved." onRetry={handleRetry} onDismiss={clearError} />
 *
 * @example
 * // Card — section-level error inside a layout card
 * <ErrorDisplay variant="card" title="Failed to load patients" error={err} onRetry={refetch} />
 *
 * @example
 * // Page — full-page error boundary fallback
 * <ErrorDisplay variant="page" title="Unexpected error" error={error} onRetry={() => reset()} action={{ label: 'Go home', onClick: () => router.push('/') }} />
 */
function ErrorDisplay({ variant = 'inline', ...props }: ErrorDisplayProps) {
  switch (variant) {
    case 'banner':
      return <BannerError {...props} />
    case 'card':
      return <CardError {...props} />
    case 'page':
      return <PageError {...props} />
    case 'inline':
    default:
      return <InlineError {...props} />
  }
}

export {
  ErrorDisplay,
  InlineError,
  BannerError,
  CardError,
  PageError,
  errorDisplayVariants,
  type ErrorIconType,
}
