'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { SocketWithQuery } from '@/types/models'
import {
  createDeviceEmitter,
  subscribeToCastingEvents,
} from '@/lib/device-event-controller'

export type CastingStatus =
  | 'idle'
  | 'requesting'
  | 'negotiating'
  | 'connected'
  | 'error'

/**
 * WebRTC casting handshake: console requests offer → VR sends offer →
 * console creates answer and sends it. Attaches remote video track to videoRef.
 * Uses same per-device socket and room as patient dashboard. ICE omitted for prototype.
 */
export function useCastingHandshake(socket: SocketWithQuery | null) {
  const [status, setStatus] = useState<CastingStatus>('idle')
  const videoRef = useRef<HTMLVideoElement>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)

  const emitter = socket ? createDeviceEmitter(socket) : null

  const handleOffer = useCallback(
    async (offerJson: unknown) => {
      if (!socket || !emitter) return
      try {
        setStatus('negotiating')
        const offerDesc =
          typeof offerJson === 'string' ? JSON.parse(offerJson) : offerJson
        if (offerDesc && typeof offerDesc === 'object') {
          offerDesc.type =
            (offerDesc.type as string)?.toLowerCase?.() ?? 'offer'
        }

        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        })
        pcRef.current = pc

        pc.ontrack = (event) => {
          if (videoRef.current?.srcObject) return
          if (event.streams?.[0]) {
            videoRef.current!.srcObject = event.streams[0]
          } else {
            videoRef.current!.srcObject = new MediaStream([event.track])
          }
          setStatus('connected')
        }

        pc.oniceconnectionstatechange = () => {
          console.log('[casting] ICE connection state:', pc.iceConnectionState)
          if (pc.iceConnectionState === 'failed') {
            console.warn('[casting] ICE connection failed')
          }
        }

        await pc.setRemoteDescription(offerDesc)
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        await new Promise<void>((resolve) => {
          if (pc.iceGatheringState === 'complete') {
            resolve()
            return
          }
          const onGatheringStateChange = () => {
            if (pc.iceGatheringState === 'complete') {
              pc.removeEventListener(
                'icegatheringstatechange',
                onGatheringStateChange,
              )
              resolve()
            }
          }
          pc.addEventListener('icegatheringstatechange', onGatheringStateChange)
        })

        const answerDesc = pc.localDescription
        if (answerDesc) {
          emitter.sendCastingAnswer(answerDesc)
        }
      } catch (e) {
        console.error('[casting] Error handling offer:', e)
        setStatus('error')
      }
    },
    [socket, emitter],
  )

  useEffect(() => {
    if (!socket) return
    const unsubscribe = subscribeToCastingEvents(socket, {
      onOffer: handleOffer,
    })
    return () => {
      unsubscribe()
      emitter?.stopCasting()
    }
  }, [socket, handleOffer, emitter])

  const startCasting = useCallback(() => {
    if (!socket?.connected || !emitter) {
      console.warn('[casting] Socket not connected')
      setStatus('error')
      return
    }
    setStatus('requesting')
    emitter.requestCastingOffer()
  }, [socket, emitter])

  const stopCasting = useCallback(() => {
    const pc = pcRef.current
    if (pc) {
      pc.close()
      pcRef.current = null
    }
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((t) => t.stop())
      videoRef.current.srcObject = null
    }
    setStatus('idle')
    emitter?.stopCasting()
  }, [emitter])

  useEffect(() => {
    return () => {
      pcRef.current?.close()
      pcRef.current = null
    }
  }, [])

  return { startCasting, stopCasting, videoRef, status }
}
