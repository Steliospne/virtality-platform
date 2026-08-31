export const EMAIL_LINK_SOURCE_PARAM = 'src'
export const EMAIL_LINK_SOURCE_VALUE = 'email'

/** Appends the email-link-source marker to a URL built for an email CTA. */
export function withEmailLinkSource(url: string): string {
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}${EMAIL_LINK_SOURCE_PARAM}=${EMAIL_LINK_SOURCE_VALUE}`
}
