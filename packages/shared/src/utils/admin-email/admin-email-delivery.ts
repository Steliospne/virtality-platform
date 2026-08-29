export type SendIndividualEmail = (options: {
  to: string
  subject: string
  html: string
}) => Promise<void>

export type IndividualEmailDeliveryResult = {
  recipientEmail: string
  status: 'sent' | 'failed'
  errorMessage?: string
  attemptedAt: Date
}

export type IndividualEmailDeliveryInput = {
  recipients: string[]
  subject: string
  html: string
  sendEmail: SendIndividualEmail
}

export const deliverIndividualEmails = async (
  input: IndividualEmailDeliveryInput,
): Promise<IndividualEmailDeliveryResult[]> => {
  const results: IndividualEmailDeliveryResult[] = []

  for (const recipient of input.recipients) {
    const attemptedAt = new Date()

    try {
      await input.sendEmail({
        to: recipient,
        subject: input.subject,
        html: input.html,
      })
      results.push({
        recipientEmail: recipient,
        status: 'sent',
        attemptedAt,
      })
    } catch (error) {
      results.push({
        recipientEmail: recipient,
        status: 'failed',
        errorMessage:
          error instanceof Error ? error.message : 'email delivery failed',
        attemptedAt,
      })
    }
  }

  return results
}
