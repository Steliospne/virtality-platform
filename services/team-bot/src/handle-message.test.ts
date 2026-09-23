import { describe, expect, it, vi } from 'vitest'
import { handleIncomingMessage } from './handle-message.ts'
import { createSeenMessages } from './seen-messages.ts'
import type { IncomingMessage } from './whatsapp/webhook-payload.ts'

const TEAMMATE = '306900000000'

function createDeps() {
  const createIssue = vi.fn().mockResolvedValue({
    identifier: 'VIR-42',
    url: 'https://linear.app/virtality/issue/VIR-42',
  })
  const getTeamDirectory = vi.fn().mockResolvedValue({
    members: [
      {
        id: 'user-eleni',
        name: 'Eleni P',
        displayName: 'eleni',
        email: 'eleni@virtality.app',
      },
    ],
    labels: [{ id: 'label-bug', name: 'Bug' }],
    statuses: [{ id: 'state-todo', name: 'Todo' }],
  })
  const replyText = vi.fn().mockResolvedValue(undefined)
  const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }

  return {
    deps: {
      phoneNumberId: 'phone-id',
      allowedSenders: new Set([TEAMMATE]),
      seenMessages: createSeenMessages(),
      linear: { createIssue, getTeamDirectory },
      whatsapp: { replyText },
      logger,
    },
    createIssue,
    getTeamDirectory,
    replyText,
    logger,
  }
}

function message(overrides?: Partial<IncomingMessage>): IncomingMessage {
  return {
    id: 'wamid.1',
    from: TEAMMATE,
    senderName: 'Eleni',
    phoneNumberId: 'phone-id',
    type: 'text',
    text: 'Fix login\nSpins forever',
    ...overrides,
  }
}

describe('handleIncomingMessage', () => {
  it('creates an issue and replies with its link', async () => {
    const { deps, createIssue, replyText } = createDeps()

    await handleIncomingMessage(message(), deps)

    expect(createIssue).toHaveBeenCalledWith({
      title: 'Fix login',
      description: 'Spins forever\n\n_Reported via WhatsApp by Eleni_',
      labelIds: [],
    })
    expect(replyText).toHaveBeenCalledWith({
      to: TEAMMATE,
      replyToMessageId: 'wamid.1',
      body: 'Created VIR-42: Fix login\nhttps://linear.app/virtality/issue/VIR-42',
    })
  })

  it('skips the Linear lookup when no names or labels are used', async () => {
    const { deps, getTeamDirectory } = createDeps()

    await handleIncomingMessage(message({ text: 'Fix login !high' }), deps)

    expect(getTeamDirectory).not.toHaveBeenCalled()
  })

  it('sets status, assignee, priority and labels', async () => {
    const { deps, createIssue, replyText } = createDeps()

    await handleIncomingMessage(
      message({ text: 'Fix login\n@eleni !urgent #bug /todo' }),
      deps,
    )

    expect(createIssue).toHaveBeenCalledWith({
      title: 'Fix login',
      description: '_Reported via WhatsApp by Eleni_',
      assigneeId: 'user-eleni',
      priority: 1,
      labelIds: ['label-bug'],
      stateId: 'state-todo',
    })
    expect(replyText.mock.calls[0]?.[0].body).toBe(
      'Created VIR-42: Fix login\nTodo · Eleni P · Urgent · Bug\nhttps://linear.app/virtality/issue/VIR-42',
    )
  })

  it('creates several issues in message order', async () => {
    const { deps, createIssue, replyText } = createDeps()
    createIssue
      .mockResolvedValueOnce({ identifier: 'VIR-1', url: 'https://l/VIR-1' })
      .mockResolvedValueOnce({ identifier: 'VIR-2', url: 'https://l/VIR-2' })

    await handleIncomingMessage(
      message({ text: 'First\n---\nSecond #bug' }),
      deps,
    )

    expect(createIssue.mock.calls.map(([input]) => input.title)).toEqual([
      'First',
      'Second',
    ])
    expect(replyText.mock.calls[0]?.[0].body).toBe(
      [
        'Created 2 of 2 issues:',
        'VIR-1: First\nhttps://l/VIR-1',
        'VIR-2: Second\nBug\nhttps://l/VIR-2',
      ].join('\n\n'),
    )
  })

  it('lists the issues that failed when others were created', async () => {
    const { deps, createIssue, replyText } = createDeps()
    createIssue
      .mockResolvedValueOnce({ identifier: 'VIR-1', url: 'https://l/VIR-1' })
      .mockRejectedValueOnce(new Error('Linear down'))

    await handleIncomingMessage(message({ text: 'First\n---\nSecond' }), deps)

    expect(replyText.mock.calls[0]?.[0].body).toBe(
      [
        'Created 1 of 2 issues:',
        'VIR-1: First\nhttps://l/VIR-1',
        "Couldn't create these, send them again:\n• Second",
      ].join('\n\n'),
    )
  })

  it('creates nothing when any issue has an unknown name or label', async () => {
    const { deps, createIssue, replyText } = createDeps()

    await handleIncomingMessage(
      message({ text: 'First #bug\n---\nSecond @maria' }),
      deps,
    )

    expect(createIssue).not.toHaveBeenCalled()
    expect(replyText.mock.calls[0]?.[0].body).toBe(
      'Nothing was created. Fix this and send it again:\n\n• Issue 2: No teammate called @maria. Try: @eleni',
    )
  })

  it('creates nothing when the team lookup fails', async () => {
    const { deps, createIssue, getTeamDirectory, replyText, logger } =
      createDeps()
    getTeamDirectory.mockRejectedValue(new Error('Linear down'))

    await handleIncomingMessage(message({ text: 'Fix login #bug' }), deps)

    expect(createIssue).not.toHaveBeenCalled()
    expect(logger.error).toHaveBeenCalled()
    expect(replyText.mock.calls[0]?.[0].body).toMatch(/Couldn't reach Linear/)
  })

  it('handles a redelivered message only once', async () => {
    const { deps, createIssue } = createDeps()

    await handleIncomingMessage(message(), deps)
    await handleIncomingMessage(message(), deps)

    expect(createIssue).toHaveBeenCalledTimes(1)
  })

  it('ignores senders outside the allowlist without replying', async () => {
    const { deps, createIssue, replyText } = createDeps()

    await handleIncomingMessage(message({ from: '15551234567' }), deps)

    expect(createIssue).not.toHaveBeenCalled()
    expect(replyText).not.toHaveBeenCalled()
  })

  it('ignores messages sent to another phone number on the app', async () => {
    const { deps, createIssue } = createDeps()

    await handleIncomingMessage(message({ phoneNumberId: 'other' }), deps)

    expect(createIssue).not.toHaveBeenCalled()
  })

  it('answers help without creating an issue', async () => {
    const { deps, createIssue, replyText } = createDeps()

    await handleIncomingMessage(message({ text: 'help' }), deps)

    expect(createIssue).not.toHaveBeenCalled()
    expect(replyText).toHaveBeenCalledOnce()
  })

  it('explains that only text is supported', async () => {
    const { deps, createIssue, replyText } = createDeps()

    await handleIncomingMessage(
      message({ type: 'image', text: undefined }),
      deps,
    )

    expect(createIssue).not.toHaveBeenCalled()
    expect(replyText.mock.calls[0]?.[0].body).toMatch(/only read text/)
  })

  it('tells the sender when Linear fails', async () => {
    const { deps, createIssue, replyText, logger } = createDeps()
    createIssue.mockRejectedValue(new Error('Linear down'))

    await handleIncomingMessage(message(), deps)

    expect(logger.error).toHaveBeenCalled()
    expect(replyText.mock.calls[0]?.[0].body).toMatch(/Couldn't create/)
  })
})
