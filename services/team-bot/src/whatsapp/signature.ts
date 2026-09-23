const SIGNATURE_PREFIX = 'sha256='

function hexToBytes(hex: string) {
  if (hex.length % 2 !== 0 || /[^0-9a-f]/i.test(hex)) return null

  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

/**
 * Checks Meta's `X-Hub-Signature-256` header: an HMAC-SHA256 of the raw
 * request body keyed with the App Secret. Must run on the exact bytes Meta
 * sent, before any JSON parsing.
 *
 * Uses WebCrypto (not node:crypto) so the same code runs on Workers;
 * `subtle.verify` compares in constant time.
 */
export async function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | undefined,
  appSecret: string,
) {
  if (!signatureHeader?.startsWith(SIGNATURE_PREFIX)) return false

  const signature = hexToBytes(signatureHeader.slice(SIGNATURE_PREFIX.length))
  if (!signature) return false

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(appSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  )

  return crypto.subtle.verify('HMAC', key, signature, encoder.encode(rawBody))
}
