import { describe, expect, it, vi } from 'vitest'
import type { Socket } from 'socket.io-client'
import { parseHeadsetPayload, subscribe } from './device-event-controller.js'

type Listener = (...args: unknown[]) => void

function createSocket() {
  const listeners = new Map<string, Listener[]>()
  const socket = {
    on: (event: string, fn: Listener) => {
      listeners.set(event, [...(listeners.get(event) ?? []), fn])
    },
    off: (event: string, fn: Listener) => {
      listeners.set(
        event,
        (listeners.get(event) ?? []).filter((l) => l !== fn),
      )
    },
  }
  return {
    socket: socket as unknown as Socket,
    emit: (event: string, ...args: unknown[]) =>
      (listeners.get(event) ?? []).forEach((fn) => fn(...args)),
    listenerCount: (event: string) => (listeners.get(event) ?? []).length,
  }
}

describe('parseHeadsetPayload', () => {
  it('parses the JSON text the headset emits for an object payload', () => {
    expect(
      parseHeadsetPayload('{"videoId":"trail","bytesDownloaded":3}'),
    ).toEqual({ videoId: 'trail', bytesDownloaded: 3 })
    expect(parseHeadsetPayload(' [1,2]')).toEqual([1, 2])
  })

  it('leaves a bare id alone, even one made of digits', () => {
    expect(parseHeadsetPayload('0f328b26a44c41b48bf1397da72f4a20')).toBe(
      '0f328b26a44c41b48bf1397da72f4a20',
    )
    expect(parseHeadsetPayload('12345')).toBe('12345')
  })

  it('leaves objects, numbers and malformed JSON alone', () => {
    const payload = { videoId: 'trail' }
    expect(parseHeadsetPayload(payload)).toBe(payload)
    expect(parseHeadsetPayload(7)).toBe(7)
    expect(parseHeadsetPayload(undefined)).toBeUndefined()
    expect(parseHeadsetPayload('{not json')).toBe('{not json')
  })
})

describe('subscribe', () => {
  const EVENTS = { Progress: 'videoDownloadProgress', Ack: 'videoDownloadAck' }

  it('hands handlers parsed payloads and bare ids as sent', () => {
    const { socket, emit } = createSocket()
    const onProgress = vi.fn()
    const onAck = vi.fn()
    subscribe(socket, EVENTS, { Progress: onProgress, Ack: onAck })

    emit('videoDownloadProgress', '{"videoId":"trail","bytesDownloaded":3}')
    emit('videoDownloadAck', 'trail')

    expect(onProgress).toHaveBeenCalledWith({
      videoId: 'trail',
      bytesDownloaded: 3,
    })
    expect(onAck).toHaveBeenCalledWith('trail')
  })

  it('unsubscribes the listeners it registered', () => {
    const { socket, listenerCount } = createSocket()
    const unsubscribe = subscribe(socket, EVENTS, { Progress: vi.fn() })

    expect(listenerCount('videoDownloadProgress')).toBe(1)
    unsubscribe()
    expect(listenerCount('videoDownloadProgress')).toBe(0)
  })
})
