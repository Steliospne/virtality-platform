'use client'

import { useEffect, useRef } from 'react'

const CONFETTI_COLORS = [
  '#39dff5',
  '#65e6f7',
  '#f5b83c',
  '#fcd34d',
  '#a78bfa',
  '#fb7185',
]

const PARTICLE_COUNT = 160
const GRAVITY = 0.12
const DRAG = 0.995
const ACTIVE_DURATION_MS = 5_500

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  rotation: number
  rotationSpeed: number
  tiltPhase: number
}

function createParticle(width: number, height: number): Particle {
  return {
    x: Math.random() * width,
    y: -20 - Math.random() * height * 0.5,
    vx: (Math.random() - 0.5) * 4,
    vy: 2 + Math.random() * 3,
    size: 6 + Math.random() * 6,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.2,
    tiltPhase: Math.random() * Math.PI * 2,
  }
}

/**
 * Lightweight, dependency-free confetti burst for the trial welcome page.
 * Runs for a fixed duration then stops updating, leaving the settled pieces
 * on screen without an indefinite animation loop.
 */
export function TrialWelcomeConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (prefersReducedMotion) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = window.innerWidth
    let height = window.innerHeight
    const dpr = window.devicePixelRatio || 1

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.scale(dpr, dpr)
    }
    resize()
    window.addEventListener('resize', resize)

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () =>
      createParticle(width, height),
    )

    const startedAtMs = Date.now()
    let frameId: number | null = null

    const step = () => {
      ctx.clearRect(0, 0, width, height)

      for (const particle of particles) {
        particle.vy += GRAVITY
        particle.vx *= DRAG
        particle.vy *= DRAG
        particle.tiltPhase += 0.08
        particle.x += particle.vx + Math.sin(particle.tiltPhase) * 0.6
        particle.y += particle.vy
        particle.rotation += particle.rotationSpeed

        if (particle.y > height + 30) {
          Object.assign(particle, createParticle(width, height))
        }

        ctx.save()
        ctx.translate(particle.x, particle.y)
        ctx.rotate(particle.rotation)
        ctx.fillStyle = particle.color
        ctx.fillRect(
          -particle.size / 2,
          -particle.size / 4,
          particle.size,
          particle.size / 2,
        )
        ctx.restore()
      }

      if (Date.now() - startedAtMs < ACTIVE_DURATION_MS) {
        frameId = requestAnimationFrame(step)
      }
    }

    frameId = requestAnimationFrame(step)

    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className='h-full w-full'
      style={{ width: '100%', height: '100%' }}
    />
  )
}
