export const CONSOLE_REPLACEMENT_NOTICE_MESSAGE =
  'This console was replaced by a newer connection. Use the active tab to continue treatment.'

export type SocketReplacementConnectionMeta = {
  state: 'failed'
  attempt: 0
  error: string
}

export function buildReplacementNoticeConnectionMeta(): SocketReplacementConnectionMeta {
  return {
    state: 'failed',
    attempt: 0,
    error: CONSOLE_REPLACEMENT_NOTICE_MESSAGE,
  }
}
