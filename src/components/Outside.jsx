import * as THREE from 'three'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { asset } from '../assets'

// Everything outside the window lives on layer 1. It is rendered into its own
// buffer and then drawn through the rainy glass shader (see RainGlass.jsx).
export const OUTSIDE_LAYER = 1
export const SKY_COLOR = '#171a26'

function Skyline() {
  const tex = useTexture(asset('textures/skyline.jpg'))
  useLayoutEffect(() => {
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
  }, [tex])
  // photo aspect is 3072 x 714
  const w = 264
  const h = (w * 714) / 3072
  // bottom edge sits a little below eye level, 120 m away
  return (
    <mesh position={[14, -3.2 + h / 2, -120]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={tex} color={[0.95, 0.86, 0.76]} toneMapped={false} />
    </mesh>
  )
}

// Nearby rooftops (we are a few floors up), drawn on a canvas with lit windows
// that switch on and off over time.
function makeRooftops() {
  const W = 2048
  const H = 410
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')
  let seed = 11
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
  const windows = []
  const blinkers = []
  let x = -20
  while (x < W) {
    const w = 120 + rand() * 260
    const top = H * (0.04 + rand() * 0.42)
    const shade = 8 + Math.floor(rand() * 10)
    ctx.fillStyle = `rgb(${shade},${shade + 2},${shade + 12})`
    ctx.fillRect(x, top, w, H - top)
    // roof edge highlight from the city glow
    ctx.fillStyle = 'rgba(120,110,190,0.25)'
    ctx.fillRect(x, top, w, 2)
    // rooftop clutter
    if (rand() > 0.5) {
      ctx.fillStyle = `rgb(${shade},${shade + 2},${shade + 12})`
      const tw = 20 + rand() * 30
      ctx.fillRect(x + rand() * (w - tw), top - 12, tw, 12)
    }
    if (rand() > 0.7) blinkers.push([x + w / 2, top - 14])
    for (let wy = top + 12; wy < H - 8; wy += 30) {
      for (let wx = x + 12; wx < x + w - 22; wx += 26) {
        windows.push({ x: wx, y: wy, on: rand() < 0.42, warm: rand() > 0.25, a: 0.45 + rand() * 0.55 })
      }
    }
    x += w + 4 + rand() * 30
  }
  const glow = ctx.createLinearGradient(0, H * 0.75, 0, H)
  glow.addColorStop(0, 'rgba(255,150,70,0)')
  glow.addColorStop(1, 'rgba(255,150,70,0.28)')
  const base = ctx.getImageData(0, 0, W, H)
  return { c, ctx, W, H, windows, base, glow, blinkers, rand }
}

function drawRooftops(r) {
  const { ctx, base, windows, glow, W, H } = r
  ctx.putImageData(base, 0, 0)
  for (const w of windows) {
    if (!w.on) continue
    ctx.globalAlpha = w.a
    ctx.fillStyle = w.warm ? '#ffcf8f' : '#b9dcff'
    ctx.fillRect(w.x, w.y, 13, 18)
  }
  ctx.globalAlpha = 1
  ctx.fillStyle = glow
  ctx.fillRect(0, H * 0.75, W, H * 0.25)
}

function Rooftops() {
  const r = useMemo(makeRooftops, [])
  const tex = useMemo(() => {
    drawRooftops(r)
    const t = new THREE.CanvasTexture(r.c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [r])
  useEffect(() => {
    const id = setInterval(() => {
      for (let i = 0; i < 6; i++) {
        const w = r.windows[Math.floor(Math.random() * r.windows.length)]
        w.on = !w.on
      }
      drawRooftops(r)
      tex.needsUpdate = true
    }, 1400)
    return () => clearInterval(id)
  }, [r, tex])

  const blinkRef = useRef()
  useFrame(({ clock }) => {
    const on = Math.sin(clock.elapsedTime * 2.6) > 0.6
    blinkRef.current?.children.forEach((m, i) => (m.visible = on !== (i % 2 === 0)))
  })

  // 60 m away, roofs just below eye level (we are a few floors up)
  const w = 60
  const h = (w * r.H) / r.W
  const top = 0.9
  const toWorld = ([px, py]) => [(px / r.W - 0.5) * w, top - (py / r.H) * h, -59.8]
  return (
    <group>
      <mesh position={[0, top - h / 2, -60]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={tex} transparent toneMapped={false} />
      </mesh>
      <group ref={blinkRef}>
        {r.blinkers.map((b, i) => (
          <mesh key={i} position={toWorld(b)}>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshBasicMaterial color={[4, 0.3, 0.2]} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function Airplane() {
  const ref = useRef()
  useFrame(({ clock }) => {
    const t = (clock.elapsedTime % 70) / 70
    ref.current.position.set(-110 + t * 220, 26 + t * 6, -110)
    ref.current.visible = Math.sin(clock.elapsedTime * 7) > 0.5
  })
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.25, 8, 8]} />
      <meshBasicMaterial color={[3, 3, 3.5]} toneMapped={false} />
    </mesh>
  )
}

function RainStreaks({ count = 1800 }) {
  const ref = useRef()
  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 6)
    const speeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 8
      const y = Math.random() * 6 - 1
      const z = -1.5 - Math.random() * 7
      const len = 0.12 + Math.random() * 0.12
      positions.set([x, y, z, x + 0.02, y - len, z], i * 6)
      speeds[i] = 6 + Math.random() * 4
    }
    return { positions, speeds }
  }, [count])
  useFrame((_, dt) => {
    const attr = ref.current.geometry.attributes.position
    const a = attr.array
    const d = Math.min(dt, 0.05)
    for (let i = 0; i < count; i++) {
      const o = i * 6
      const dy = speeds[i] * d
      a[o + 1] -= dy
      a[o + 4] -= dy
      a[o] += dy * 0.15
      a[o + 3] += dy * 0.15
      if (a[o + 4] < -1) {
        const len = a[o + 1] - a[o + 4]
        const x = (Math.random() - 0.5) * 8
        a[o] = x
        a[o + 3] = x + 0.02
        a[o + 1] = 5
        a[o + 4] = 5 - len
      }
    }
    attr.needsUpdate = true
  })
  return (
    <lineSegments ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#c9d6ff" transparent opacity={0.28} toneMapped={false} />
    </lineSegments>
  )
}

export default function Outside() {
  const group = useRef()
  useLayoutEffect(() => {
    group.current.traverse((o) => o.layers.set(OUTSIDE_LAYER))
  })
  return (
    <group ref={group}>
      <mesh position={[0, 60, -160]}>
        <planeGeometry args={[900, 260]} />
        <meshBasicMaterial color={SKY_COLOR} toneMapped={false} />
      </mesh>
      <Skyline />
      <Airplane />
      <Rooftops />
      <RainStreaks />
    </group>
  )
}
