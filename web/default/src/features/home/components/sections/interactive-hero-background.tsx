/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

type Particle = {
  x: number
  y: number
  baseX: number
  baseY: number
  vx: number
  vy: number
  size: number
}

type InteractiveHeroBackgroundProps = {
  className?: string
  /** Particle grid density — larger gap = fewer particles. */
  gap?: number
  /** Pointer influence radius in px. */
  radius?: number
}

/**
 * Zero-dependency canvas background: a grid of particles that ripple away from
 * the cursor and ease back to their home position. Tuned for dark mode (cobalt
 * → cyan accents that pick up the 顺风 brand palette). Respects
 * prefers-reduced-motion and pauses when the document is hidden.
 */
export function InteractiveHeroBackground({
  className,
  gap = 34,
  radius = 130,
}: InteractiveHeroBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    let particles: Particle[] = []
    let width = 0
    let height = 0
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    const pointer = { x: -9999, y: -9999, active: false }
    let rafId = 0

    const isDark = () =>
      document.documentElement.classList.contains('dark')

    const build = () => {
      const rect = canvas.parentElement?.getBoundingClientRect()
      width = rect?.width ?? canvas.clientWidth
      height = rect?.height ?? canvas.clientHeight
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      particles = []
      for (let y = gap / 2; y < height; y += gap) {
        for (let x = gap / 2; x < width; x += gap) {
          particles.push({
            x,
            y,
            baseX: x,
            baseY: y,
            vx: 0,
            vy: 0,
            size: Math.random() * 1.1 + 0.7,
          })
        }
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      const dark = isDark()
      const r2 = radius * radius

      for (const p of particles) {
        // pointer repulsion
        if (pointer.active) {
          const dx = p.x - pointer.x
          const dy = p.y - pointer.y
          const d2 = dx * dx + dy * dy
          if (d2 < r2 && d2 > 0.01) {
            const d = Math.sqrt(d2)
            const force = (1 - d / radius) * 5.5
            p.vx += (dx / d) * force
            p.vy += (dy / d) * force
          }
        }

        // spring back home + damping
        p.vx += (p.baseX - p.x) * 0.045
        p.vy += (p.baseY - p.y) * 0.045
        p.vx *= 0.82
        p.vy *= 0.82
        p.x += p.vx
        p.y += p.vy

        // displacement drives brightness so the ripple "glows"
        const dispX = p.x - p.baseX
        const dispY = p.y - p.baseY
        const disp = Math.min(Math.sqrt(dispX * dispX + dispY * dispY), 40)
        const t = disp / 40

        if (dark) {
          // base cobalt -> excited cyan
          const baseA = 0.18 + t * 0.55
          const g = Math.round(160 + t * 80)
          const b = Math.round(230 + t * 25)
          ctx.fillStyle = `rgba(90, ${g}, ${b}, ${baseA})`
        } else {
          const baseA = 0.1 + t * 0.4
          ctx.fillStyle = `rgba(37, 99, 235, ${baseA})`
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size + t * 1.4, 0, Math.PI * 2)
        ctx.fill()
      }

      rafId = requestAnimationFrame(draw)
    }

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointer.x = e.clientX - rect.left
      pointer.y = e.clientY - rect.top
      pointer.active = true
    }
    const onPointerLeave = () => {
      pointer.active = false
      pointer.x = -9999
      pointer.y = -9999
    }

    build()
    if (!reduceMotion) {
      rafId = requestAnimationFrame(draw)
    } else {
      draw() // single static frame
    }

    const onResize = () => build()
    window.addEventListener('resize', onResize)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerleave', onPointerLeave)

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafId)
      } else if (!reduceMotion) {
        rafId = requestAnimationFrame(draw)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerleave', onPointerLeave)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [gap, radius])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn('pointer-events-none size-full', className)}
    />
  )
}
