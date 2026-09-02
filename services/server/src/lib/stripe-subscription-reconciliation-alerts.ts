import type { SlackMessage } from '@virtality/shared/utils'
import {
  buildStripeSubscriptionReconciliationDriftSlackMessage,
  buildStripeSubscriptionReconciliationFailureSlackMessage,
  sendSlackMessage,
  StripeSubscriptionReconciliationError,
  type ReconcileStripeSubscriptionsResult,
} from '@virtality/shared/utils'
import type { AppLogger } from '@virtality/shared/observability'

export type StripeSubscriptionReconciliationAlertDeps = {
  getWebhookUrl: () => string | undefined
  sendSlack: typeof sendSlackMessage
  fetchImpl?: typeof fetch
  logger: AppLogger
}

function resolveFailureStage(error: unknown): string {
  if (error instanceof StripeSubscriptionReconciliationError) {
    return error.stage
  }

  return 'catalog_load'
}

function resolveFailureMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

async function deliverSlackAlert(
  message: SlackMessage,
  deps: StripeSubscriptionReconciliationAlertDeps,
  alert: 'drift' | 'failure',
  attributes: Record<string, unknown>,
): Promise<void> {
  const webhookUrl = deps.getWebhookUrl()
  if (!webhookUrl) {
    deps.logger.warn('billing.subscription.reconcile.slack_skipped', {
      reason: 'missing_webhook',
      alert,
      ...attributes,
    })
    return
  }

  try {
    await deps.sendSlack(webhookUrl, message, 'subscription-reconciliation', {
      fetchImpl: deps.fetchImpl,
      logger: deps.logger,
      failureEvent: 'billing.subscription.reconcile.slack_send.failed',
    })
  } catch (error) {
    deps.logger.error(
      'billing.subscription.reconcile.slack_alert_failed',
      { alert, error, ...attributes },
      'Failed to send Stripe subscription reconciliation Slack alert',
    )
  }
}

export async function alertStripeSubscriptionReconciliationDrift(
  result: ReconcileStripeSubscriptionsResult,
  deps: StripeSubscriptionReconciliationAlertDeps,
): Promise<void> {
  const message = buildStripeSubscriptionReconciliationDriftSlackMessage(result)
  if (!message) {
    return
  }

  await deliverSlackAlert(message, deps, 'drift', {
    driftCount: result.drift.length,
  })
}

export async function alertStripeSubscriptionReconciliationFailure(
  input: { stage?: string; error: unknown },
  deps: StripeSubscriptionReconciliationAlertDeps,
): Promise<void> {
  const stage = input.stage ?? resolveFailureStage(input.error)
  const message = buildStripeSubscriptionReconciliationFailureSlackMessage({
    stage,
    errorMessage: resolveFailureMessage(input.error),
  })

  await deliverSlackAlert(message, deps, 'failure', { stage })
}

export function createStripeSubscriptionReconciliationAlertDeps(
  logger: AppLogger,
): StripeSubscriptionReconciliationAlertDeps {
  return {
    getWebhookUrl: () =>
      process.env.SLACK_MESSAGE_WEBHOOK_URL?.trim() || undefined,
    sendSlack: sendSlackMessage,
    logger,
  }
}
