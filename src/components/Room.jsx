import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'

// Room layout (metres). Floor is y = 0, back wall sits at z = -1.2.
const WALL_COLOR = '#4a4049'
const FRAME_COLOR = '#2b2420'
export const WIN = { x0: -0.9, x1: 0.9, y0: 1.0, y1: 2.3 }
const WALL_Z = -1.2

export function Box({ args, position, rotation, color, rough = 0.85, metal = 0, cast = true, ...rest }) {
  return (
    <mesh position={position} rotation={rotation} castShadow={cast} receiveShadow {...rest}>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} roughness={rough} metalness={metal} />
    </mesh>
  )
}

function Walls() {
  return (
    <group>
      {/* back wall with a window opening */}
      <Box args={[1.6, 2.8, 0.12]} position={[-1.7, 1.4, WALL_Z]} color={WALL_COLOR} cast={false} />
      <Box args={[1.6, 2.8, 0.12]} position={[1.7, 1.4, WALL_Z]} color={WALL_COLOR} cast={false} />
      <Box args={[1.8, 1.0, 0.12]} position={[0, 0.5, WALL_Z]} color={WALL_COLOR} cast={false} />
      <Box args={[1.8, 0.5, 0.12]} position={[0, 2.55, WALL_Z]} color={WALL_COLOR} cast={false} />
      {/* side walls, ceiling, floor */}
      <Box args={[0.1, 2.8, 5]} position={[-2.55, 1.4, 1.3]} color={WALL_COLOR} cast={false} />
      <Box args={[0.1, 2.8, 5]} position={[2.55, 1.4, 1.3]} color={WALL_COLOR} cast={false} />
      <Box args={[5.2, 0.1, 5]} position={[0, 2.85, 1.3]} color="#3a3239" cast={false} />
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 1.3]} receiveShadow>
        <planeGeometry args={[5.2, 5]} />
        <meshStandardMaterial color="#2b1e17" roughness={0.7} />
      </mesh>
      {/* skirting board */}
      <Box args={[5, 0.08, 0.02]} position={[0, 0.04, WALL_Z + 0.07]} color="#2a2228" cast={false} />
    </group>
  )
}

function WindowFrame() {
  const z = WALL_Z
  return (
    <group>
      <Box args={[0.05, 1.3, 0.14]} position={[-0.875, 1.65, z]} color={FRAME_COLOR} />
      <Box args={[0.05, 1.3, 0.14]} position={[0.875, 1.65, z]} color={FRAME_COLOR} />
      <Box args={[1.8, 0.05, 0.14]} position={[0, 2.275, z]} color={FRAME_COLOR} />
      <Box args={[1.8, 0.05, 0.14]} position={[0, 1.025, z]} color={FRAME_COLOR} />
      <Box args={[0.035, 1.25, 0.06]} position={[0, 1.65, z]} color={FRAME_COLOR} />
      <Box args={[1.75, 0.035, 0.06]} position={[0, 1.92, z]} color={FRAME_COLOR} />
      {/* sill */}
      <Box args={[2.0, 0.035, 0.2]} position={[0, 0.99, -1.1]} color="#3b302a" rough={0.6} />
      {/* glass */}
      <mesh position={[0, 1.65, z - 0.02]}>
        <planeGeometry args={[1.75, 1.25]} />
        <meshPhysicalMaterial color="#9fb4d0" transparent opacity={0.1} roughness={0.05} metalness={0} />
      </mesh>
    </group>
  )
}

function Curtain({ x, flip = 1 }) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.42, 1.75, 48, 1)
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) {
      const px = p.getX(i)
      p.setZ(i, Math.sin(px * 46) * 0.022 + Math.sin(px * 13) * 0.01)
    }
    g.computeVertexNormals()
    return g
  }, [])
  return (
    <mesh geometry={geo} position={[x, 1.55, -1.06]} scale-x={flip} castShadow receiveShadow>
      <meshStandardMaterial color="#b98b62" roughness={1} side={THREE.DoubleSide} />
    </mesh>
  )
}

function FairyLights() {
  const bulbs = useMemo(() => {
    const out = []
    const n = 34
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1)
      const x = -1.3 + t * 2.6
      const sag = Math.sin(t * Math.PI * 3) ** 2 * 0.09
      out.push([x, 2.4 - sag, -1.08])
    }
    return out
  }, [])
  const group = useRef()
  useFrame(({ clock }) => {
    if (!group.current) return
    group.current.children.forEach((m, i) => {
      const s = 2.2 + Math.sin(clock.elapsedTime * 1.6 + i * 1.7) * 0.8
      m.material.color.setRGB(s * 1.0, s * 0.62, s * 0.3)
    })
  })
  return (
    <group>
      {/* curtain rod */}
      <mesh position={[0, 2.46, -1.06]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.012, 0.012, 2.9, 12]} />
        <meshStandardMaterial color="#1c1a1a" metalness={0.6} roughness={0.4} />
      </mesh>
      <group ref={group}>
        {bulbs.map((p, i) => (
          <mesh key={i} position={p}>
            <sphereGeometry args={[0.012, 10, 10]} />
            <meshBasicMaterial toneMapped={false} />
          </mesh>
        ))}
      </group>
      <pointLight position={[0, 2.3, -0.95]} intensity={0.6} distance={2.5} decay={2} color="#ffbf7a" />
    </group>
  )
}

function makePosterTexture() {
  const c = document.createElement('canvas')
  c.width = 600
  c.height = 800
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#1b1d3a'
  ctx.fillRect(0, 0, 600, 800)
  const g = ctx.createLinearGradient(0, 120, 0, 520)
  g.addColorStop(0, '#ffb35c')
  g.addColorStop(1, '#ff4f7b')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(300, 340, 190, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#1b1d3a'
  for (let i = 0; i < 6; i++) ctx.fillRect(80, 360 + i * 30, 440, 8 + i * 2)
  ctx.fillStyle = '#f4ead8'
  ctx.textAlign = 'center'
  ctx.font = '900 92px Helvetica, Arial, sans-serif'
  ctx.fillText('BUILD.', 300, 640)
  ctx.font = '700 38px Helvetica, Arial, sans-serif'
  ctx.fillText('SHIP  ·  LEARN  ·  REPEAT', 300, 705)
  ctx.font = '500 20px Helvetica, Arial, sans-serif'
  ctx.globalAlpha = 0.6
  ctx.fillText('LATE NIGHT CODING CLUB — EST. 2026', 300, 760)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function Poster() {
  const tex = useMemo(makePosterTexture, [])
  return (
    <group position={[-1.65, 1.72, -1.135]}>
      <Box args={[0.64, 0.84, 0.02]} position={[0, 0, -0.005]} color="#16130f" />
      <mesh position={[0, 0, 0.007]}>
        <planeGeometry args={[0.6, 0.8]} />
        <meshStandardMaterial map={tex} roughness={0.8} />
      </mesh>
    </group>
  )
}

function Shelf() {
  const books = useMemo(() => {
    const colors = ['#c0504d', '#3f6fb5', '#e0b04a', '#2f8f6f', '#7b5ea7', '#d9d2c3', '#e06c4a', '#35495e']
    const out = []
    let x = 1.2
    for (let i = 0; i < 11; i++) {
      const w = 0.028 + ((i * 37) % 17) / 1000
      const h = 0.17 + ((i * 53) % 7) / 100
      out.push({ x: x + w / 2, w, h, color: colors[i % colors.length] })
      x += w + 0.004
    }
    return out
  }, [])
  return (
    <group>
      <Box args={[0.85, 0.025, 0.2]} position={[1.6, 1.6, -1.04]} color="#5b3f2c" rough={0.6} />
      {books.map((b, i) => (
        <Box key={i} args={[b.w, b.h, 0.15]} position={[b.x, 1.6125 + b.h / 2, -1.05]} color={b.color} />
      ))}
      {/* tiny cactus on the shelf */}
      <mesh position={[1.88, 1.66, -1.04]} castShadow>
        <cylinderGeometry args={[0.035, 0.03, 0.07, 20]} />
        <meshStandardMaterial color="#d8d2c8" roughness={0.9} />
      </mesh>
      <mesh position={[1.88, 1.73, -1.04]} castShadow>
        <capsuleGeometry args={[0.022, 0.06, 6, 12]} />
        <meshStandardMaterial color="#4f8a4a" roughness={0.8} />
      </mesh>
    </group>
  )
}

// ── outside: night city + rain ─────────────────────────────

function makeCityTexture() {
  const W = 2048
  const H = 784
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')
  const sky = ctx.createLinearGradient(0, 0, 0, H)
  sky.addColorStop(0, '#05070f')
  sky.addColorStop(0.45, '#0d1230')
  sky.addColorStop(0.75, '#2a1d45')
  sky.addColorStop(1, '#4a2a3f')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, W, H)

  // moon
  ctx.fillStyle = 'rgba(230,235,255,0.9)'
  ctx.shadowColor = 'rgba(200,210,255,0.8)'
  ctx.shadowBlur = 40
  ctx.beginPath()
  ctx.arc(W * 0.66, H * 0.2, 22, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  let seed = 7
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }

  const layer = (minTop, maxTop, base, lit, scale) => {
    let x = 0
    while (x < W) {
      const w = (40 + rand() * 90) * scale
      const top = H * (minTop + rand() * (maxTop - minTop))
      ctx.fillStyle = base
      ctx.fillRect(x, top, w, H - top)
      // antenna
      if (rand() > 0.8) {
        ctx.fillRect(x + w / 2 - 1, top - 30 * scale, 2, 30 * scale)
        ctx.fillStyle = '#ff3b3b'
        ctx.fillRect(x + w / 2 - 2, top - 32 * scale, 4, 4)
      }
      // windows
      const cw = 6 * scale
      const ch = 8 * scale
      for (let wy = top + 10 * scale; wy < H - 10; wy += ch * 2) {
        for (let wx = x + 6 * scale; wx < x + w - cw - 4; wx += cw * 2) {
          if (rand() < lit) {
            ctx.fillStyle = rand() > 0.3 ? '#ffd59a' : '#bfe3ff'
            ctx.globalAlpha = 0.5 + rand() * 0.5
            ctx.fillRect(wx, wy, cw, ch)
            ctx.globalAlpha = 1
          }
        }
      }
      x += w + rand() * 8
    }
  }
  layer(0.42, 0.62, '#151833', 0.18, 0.7)
  layer(0.3, 0.7, '#0b0d1c', 0.28, 1.1)

  const neon = (text, x, y, color, size) => {
    ctx.font = `700 ${size}px Helvetica, Arial, sans-serif`
    ctx.fillStyle = color
    ctx.shadowColor = color
    ctx.shadowBlur = 25
    ctx.fillText(text, x, y)
    ctx.fillText(text, x, y)
    ctx.shadowBlur = 0
  }
  neon('NOODLES', W * 0.36, H * 0.66, '#ff4fd8', 16)
  neon('OPEN 24H', W * 0.6, H * 0.74, '#4ff3ff', 14)
  neon('HOTEL', W * 0.47, H * 0.56, '#ffcf4f', 14)

  // street glow
  const glow = ctx.createLinearGradient(0, H * 0.8, 0, H)
  glow.addColorStop(0, 'rgba(255,140,60,0)')
  glow.addColorStop(1, 'rgba(255,140,60,0.35)')
  ctx.fillStyle = glow
  ctx.fillRect(0, H * 0.8, W, H * 0.2)

  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function City() {
  const tex = useMemo(makeCityTexture, [])
  return (
    <mesh position={[0, 2, -14]}>
      <planeGeometry args={[34, 13]} />
      <meshBasicMaterial map={tex} color={[1.25, 1.25, 1.25]} toneMapped={false} />
    </mesh>
  )
}

function Rain({ count = 1500 }) {
  const ref = useRef()
  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 6)
    const speeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 7
      const y = Math.random() * 5.5 - 0.5
      const z = -1.4 - Math.random() * 5
      const len = 0.08 + Math.random() * 0.08
      positions.set([x, y, z, x + 0.015, y - len, z], i * 6)
      speeds[i] = 5 + Math.random() * 3
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
      a[o] += dy * 0.12
      a[o + 3] += dy * 0.12
      if (a[o + 4] < -0.5) {
        const len = a[o + 1] - a[o + 4]
        a[o + 1] = 5
        a[o + 4] = 5 - len
        const x = (Math.random() - 0.5) * 7
        a[o] = x
        a[o + 3] = x + 0.015
      }
    }
    attr.needsUpdate = true
  })
  return (
    <lineSegments ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#b7ccff" transparent opacity={0.35} />
    </lineSegments>
  )
}

export default function Room() {
  return (
    <group>
      <Walls />
      <WindowFrame />
      <Curtain x={-1.15} />
      <Curtain x={1.15} flip={-1} />
      <FairyLights />
      <Poster />
      <Shelf />
      <City />
      <Rain />
    </group>
  )
}
