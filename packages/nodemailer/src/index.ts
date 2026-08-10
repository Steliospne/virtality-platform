export { sendThankYouEmail } from './lib/send-thank-you.js'
export { sendWaitlistNotification } from './lib/send-waitlist-notification.js'
export { sendDeleteAccountVerification } from './lib/send-delete-account-ver.js'
export { sendResetPassword } from './lib/send-reset-password.js'
export { sendVerificationEmail } from './lib/send-email-verification.js'
export { sendEmail } from './lib/send-email.js'
export { sendChangeEmailConfirmation } from './lib/send-change-email-confirmation.js'
export { sendPendingPasswordChange } from './lib/send-pending-password-change.js'
export { sendTrialRedeemCodeEmail } from './lib/send-trial-redeem-code.js'

export type {
  EmailData,
  ChangeEmailData,
  PendingPasswordChangeData,
} from './types/auth.js'
export type { SendEmailOptions } from './lib/send-email.js'
export type { SendWaitlistNotificationInput } from './lib/send-waitlist-notification.js'
export type { SendTrialRedeemCodeEmailData } from './lib/send-trial-redeem-code.js'
