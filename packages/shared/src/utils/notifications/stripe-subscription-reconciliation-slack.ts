import type {
  ReconciliationDriftEntry,
  ReconcileStripeSubscriptionsResult,
} from '../billing/stripe-subscription-reconciliation.ts'
import type { SlackMessage } from './slack-message.ts'

type DriftKindCounts = Record<ReconciliationDriftEntry['kind'], number>

function summarizeDriftByKind(
  drift: ReconciliationDriftEntry[],
): DriftKindCounts {
  const counts: DriftKindCounts = {
    created: 0,
    unresolvable_user: 0,
    orphaned: 0,
  }

  for (const entry of drift) {
    counts[entry.kind] += 1
  }

  return counts
}

function formatDriftDetails(drift: ReconciliationDriftEntry[]): string {
  return drift
    .map((entry) => {
      switch (entry.kind) {
        case 'created':
          return `• created \`${entry.stripeSubscriptionId}\` → local \`${entry.subscriptionId}\` (user \`${entry.userId}\`)`
        case 'unresolvable_user':
          return `• unresolvable user for Stripe sub \`${entry.stripeSubscriptionId}\``
        case 'orphaned':
          return `• orphaned local \`${entry.subscriptionId}\` (Stripe \`${entry.stripeSubscriptionId}\`, user \`${entry.userId}\`)`
      }
    })
    .join('\n')
}

export function buildStripeSubscriptionReconciliationDriftSlackMessage(
  result: Pick<ReconcileStripeSubscriptionsResult, 'drift'>,
): SlackMessage | null {
  if (result.drift.length === 0) {
    return null
  }

  const {
    created,
    unresolvable_user: unresolvableUser,
    orphaned,
  } = summarizeDriftByKind(result.drift)

  return {
    text: 'Stripe subscription reconciliation drift detected',
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '⚠️ Stripe subscription reconciliation drift',
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Created locally:*\n${created}`,
          },
          {
            type: 'mrkdwn',
            text: `*Unresolvable user:*\n${unresolvableUser}`,
          },
          {
            type: 'mrkdwn',
            text: `*Orphaned locally:*\n${orphaned}`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: formatDriftDetails(result.drift),
        },
      },
    ],
  }
}

export function buildStripeSubscriptionReconciliationFailureSlackMessage(input: {
  stage: string
  errorMessage: string
}): SlackMessage {
  return {
    text: 'Stripe subscription reconciliation failed',
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🚨 Stripe subscription reconciliation failed',
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Stage:*\n${input.stage}`,
          },
          {
            type: 'mrkdwn',
            text: `*Error:*\n${input.errorMessage}`,
          },
        ],
      },
    ],
  }
}
