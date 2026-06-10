export const formatRecipientsForInput = (recipients: string[]): string =>
  recipients.join('\n')

export const parseRecipientsFromInput = (value: string): string[] =>
  value
    .split(/[\n,;]+/)
    .map((recipient) => recipient.trim())
    .filter(Boolean)
