const MAX_TITLE_LENGTH = 200

export const HELP_TEXT = [
  'Send a message to create a Linear issue:',
  '',
  'First line → title',
  'Everything after it → description',
  '',
  'Example:',
  'Console crashes when casting',
  'Happens on Quest 3 after pairing a second headset.',
].join('\n')

export type TaskMessage =
  | { kind: 'help' }
  | { kind: 'task'; title: string; description: string | undefined }

export function parseTaskMessage(text: string): TaskMessage {
  const [firstLine = '', ...rest] = text.trim().split('\n')
  const title = firstLine.trim()

  if (!title || /^(help|\?)$/i.test(title)) return { kind: 'help' }

  const body = rest.join('\n').trim()

  // An over-long first line is usually someone who wrote everything on one
  // line; keep a readable title and move the full text into the description.
  if (title.length > MAX_TITLE_LENGTH) {
    return {
      kind: 'task',
      title: `${title.slice(0, MAX_TITLE_LENGTH - 1).trimEnd()}…`,
      description: [title, body].filter(Boolean).join('\n\n'),
    }
  }

  return { kind: 'task', title, description: body || undefined }
}
