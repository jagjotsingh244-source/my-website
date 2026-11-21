import * as THREE from 'three'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { asset, usePBR } from '../assets'
import RainGlass from './RainGlass'
import Outside from './Outside'

// Room layout (metres). Floor is y = 0, back wall sits at z = -1.2.
const FRAME_COLOR = '#7b4f2c'
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
  const plaster = usePBR('plastered_wall_04', [1.5, 2])
  const floor = usePBR('wood_floor', [3, 3])
  const wall = <meshStandardMaterial {...plaster} color="#e2c7a2" normalScale={[0.5, 0.5]} />
  const W = ({ args, position }) => (
    <mesh position={position} receiveShadow>
      <boxGeometry args={args} />
      {wall}
    </mesh>
  )
  return (
    <group>
      {/* back wall with a window opening */}
      <W args={[1.6, 2.8, 0.12]} position={[-1.7, 1.4, WALL_Z]} />
      <W args={[1.6, 2.8, 0.12]} position={[1.7, 1.4, WALL_Z]} />
      <W args={[1.8, 1.0, 0.12]} position={[0, 0.5, WALL_Z]} />
      <W args={[1.8, 0.5, 0.12]} position={[0, 2.55, WALL_Z]} />
      {/* side walls + ceiling */}
      <W args={[0.1, 2.8, 5]} position={[-2.55, 1.4, 1.3]} />
      <W args={[0.1, 2.8, 5]} position={[2.55, 1.4, 1.3]} />
      <Box args={[5.2, 0.1, 5]} position={[0, 2.85, 1.3]} color="#6e6158" cast={false} />
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 1.3]} receiveShadow>
        <planeGeometry args={[5.2, 5]} />
        <meshStandardMaterial {...floor} color="#9a7a62" />
      </mesh>
      <Box args={[5, 0.09, 0.02]} position={[0, 0.045, WALL_Z + 0.07]} color="#e8e1d6" cast={false} />
    </group>
  )
}

function WindowFrame() {
  const z = WALL_Z
  const c = FRAME_COLOR
  return (
    <group>
      <Box args={[0.08, 1.3, 0.16]} position={[-0.86, 1.65, z]} color={c} rough={0.55} />
      <Box args={[0.08, 1.3, 0.16]} position={[0.86, 1.65, z]} color={c} rough={0.55} />
      <Box args={[1.8, 0.08, 0.16]} position={[0, 2.26, z]} color={c} rough={0.55} />
      <Box args={[1.8, 0.08, 0.16]} position={[0, 1.04, z]} color={c} rough={0.55} />
      {/* casement frames: two tall panes with small panes on top */}
      <Box args={[0.07, 1.25, 0.09]} position={[0, 1.65, z + 0.02]} color={c} rough={0.55} />
      <Box args={[1.72, 0.06, 0.09]} position={[0, 2.0, z + 0.02]} color={c} rough={0.55} />
      <Box args={[0.05, 0.9, 0.06]} position={[-0.84, 1.53, z + 0.05]} color={c} rough={0.55} />
      <Box args={[0.05, 0.9, 0.06]} position={[0.84, 1.53, z + 0.05]} color={c} rough={0.55} />
      {/* handle */}
      <Box args={[0.016, 0.1, 0.03]} position={[0.07, 1.6, z + 0.08]} color="#c49a5a" rough={0.3} metal={0.8} />
      {/* sill */}
      <Box args={[2.0, 0.04, 0.24]} position={[0, 0.99, -1.1]} color="#8a5a34" rough={0.5} />
      <RainGlass position={[0, 1.65, z - 0.02]} size={[1.75, 1.25]} />
    </group>
  )
}

function Curtain({ x, flip = 1, phase = 0, width = 0.3 }) {
  const linen = usePBR('rough_linen', [1, 3])
  const geo = useMemo(() => new THREE.PlaneGeometry(width, 1.8, 48, 12), [width])
  const base = useMemo(() => geo.attributes.position.array.slice(), [geo])
  useFrame(({ clock }) => {
    const p = geo.attributes.position
    const t = clock.elapsedTime
    for (let i = 0; i < p.count; i++) {
      const px = base[i * 3]
      const py = base[i * 3 + 1]
      const hang = (0.9 - py) / 1.8 // 0 at the rod, 1 at the hem
      const fold = Math.sin(px * 60) * 0.026 + Math.sin(px * 17 + 1) * 0.01
      const sway = Math.sin(t * 0.7 + px * 6 + phase) * 0.012 * hang
      p.setZ(i, fold + sway)
    }
    p.needsUpdate = true
    geo.computeVertexNormals()
  })
  return (
    <mesh geometry={geo} position={[x, 1.55, -1.05]} scale-x={flip} castShadow receiveShadow>
      <meshStandardMaterial {...linen} color="#d6a96d" side={THREE.DoubleSide} />
    </mesh>
  )
}

function FairyLights() {
  const bulbs = useMemo(() => {
    const out = []
    const n = 34
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1)
      const sag = Math.sin(t * Math.PI * 3) ** 2 * 0.09
      out.push([-1.3 + t * 2.6, 2.42 - sag, -1.04])
    }
    return out
  }, [])
  const group = useRef()
  useFrame(({ clock }) => {
    group.current.children.forEach((m, i) => {
      const s = 2.4 + Math.sin(clock.elapsedTime * 1.4 + i * 1.7) * 0.9
      m.material.color.setRGB(s, s * 0.6, s * 0.28)
    })
  })
  return (
    <group>
      <mesh position={[0, 2.47, -1.05]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.012, 0.012, 2.9, 12]} />
        <meshStandardMaterial color="#2a2724" metalness={0.7} roughness={0.35} />
      </mesh>
      <group ref={group}>
        {bulbs.map((p, i) => (
          <mesh key={i} position={p}>
            <sphereGeometry args={[0.011, 10, 10]} />
            <meshBasicMaterial toneMapped={false} />
          </mesh>
        ))}
      </group>
      <pointLight position={[0, 2.3, -0.9]} intensity={0.5} distance={2.5} decay={2} color="#ffbf7a" />
    </group>
  )
}

function makePosterTexture() {
  const c = document.createElement('canvas')
  c.width = 600
  c.height = 800
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#efe7d8'
  ctx.fillRect(0, 0, 600, 800)
  const g = ctx.createLinearGradient(0, 140, 0, 520)
  g.addColorStop(0, '#f29a4a')
  g.addColorStop(1, '#d9445b')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(300, 330, 180, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#efe7d8'
  for (let i = 0; i < 6; i++) ctx.fillRect(100, 350 + i * 28, 400, 6 + i * 2)
  ctx.fillStyle = '#1f2433'
  ctx.textAlign = 'center'
  ctx.font = '900 88px Helvetica, Arial, sans-serif'
  ctx.fillText('BUILD.', 300, 640)
  ctx.font = '700 34px Helvetica, Arial, sans-serif'
  ctx.fillText('SHIP  ·  LEARN  ·  REPEAT', 300, 700)
  ctx.font = '500 18px Helvetica, Arial, sans-serif'
  ctx.globalAlpha = 0.6
  ctx.fillText('LATE NIGHT CODING CLUB — EST. 2026', 300, 755)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function Poster() {
  const tex = useMemo(makePosterTexture, [])
  return (
    <group position={[-1.3, 1.72, -1.13]} scale={0.68}>
      <Box args={[0.66, 0.86, 0.025]} position={[0, 0, -0.005]} color="#1a1714" rough={0.4} />
      <mesh position={[0, 0, 0.009]}>
        <planeGeometry args={[0.6, 0.8]} />
        <meshStandardMaterial map={tex} roughness={0.7} />
      </mesh>
    </group>
  )
}

function Bookshelf() {
  const { scene } = useGLTF(asset('models/book_encyclopedia_set_01/book_encyclopedia_set_01_1k.gltf'))
  const books = useMemo(() => scene.clone(true), [scene])
  useLayoutEffect(() => {
    books.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true
        o.receiveShadow = true
      }
    })
  }, [books])
  return (
    <group>
      <Box args={[0.85, 0.03, 0.22]} position={[1.62, 1.12, -1.03]} color="#6b4a34" rough={0.55} />
      <Box args={[0.02, 0.06, 0.18]} position={[1.27, 1.08, -1.05]} color="#2a2724" metal={0.7} rough={0.4} />
      <Box args={[0.02, 0.06, 0.18]} position={[1.97, 1.08, -1.05]} color="#2a2724" metal={0.7} rough={0.4} />
      {/* set is ~0.54 m wide, spines facing the room */}
      <primitive object={books} position={[1.26, 1.135, -1.02]} scale={1.05} />
    </group>
  )
}

// Framed portrait on the right of the window. Put your photo at
// public/assets/photo.jpg (square works best); a placeholder shows until then.
function makePhotoPlaceholder() {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 640
  const ctx = c.getContext('2d')
  const g = ctx.createLinearGradient(0, 0, 0, 640)
  g.addColorStop(0, '#5a5f6b')
  g.addColorStop(1, '#2c2f36')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 512, 640)
  ctx.fillStyle = 'rgba(255,255,255,0.25)'
  ctx.beginPath()
  ctx.arc(256, 250, 95, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillRect(116, 380, 280, 260)
  return c
}

function PhotoFrame() {
  const [tex, setTex] = useState(null)
  useEffect(() => {
    const done = (t) => {
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = 8
      setTex(t)
    }
    new THREE.TextureLoader().load(asset('photo.jpg'), done, undefined, () => done(new THREE.CanvasTexture(makePhotoPlaceholder())))
  }, [])
  // cover-fit the image into a 4:5 opening
  useEffect(() => {
    if (!tex?.image) return
    const iw = tex.image.width
    const ih = tex.image.height
    const target = 0.8
    const aspect = iw / ih
    if (aspect > target) {
      tex.repeat.set(target / aspect, 1)
      tex.offset.set((1 - target / aspect) / 2, 0)
    } else {
      tex.repeat.set(1, aspect / target)
      tex.offset.set(0, (1 - aspect / target) / 2)
    }
    tex.needsUpdate = true
  }, [tex])
  const spot = useMemo(() => {
    const o = new THREE.Object3D()
    o.position.set(1.42, 1.66, -1.13)
    return o
  }, [])
  return (
    <group>
      <group position={[1.42, 1.74, -1.13]} scale={1.05}>
        {/* frame, mat, photo, glass */}
        <Box args={[0.5, 0.6, 0.03]} position={[0, 0, 0]} color="#141210" rough={0.45} />
        <mesh position={[0, 0, 0.0155]}>
          <planeGeometry args={[0.44, 0.54]} />
          <meshStandardMaterial color="#f1ece3" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.01, 0.016]}>
          <planeGeometry args={[0.32, 0.4]} />
          <meshStandardMaterial map={tex} roughness={0.6} color={tex ? 'white' : '#444'} />
        </mesh>
        <mesh position={[0, 0, 0.019]}>
          <planeGeometry args={[0.44, 0.54]} />
          <meshPhysicalMaterial transparent opacity={0.08} roughness={0.05} metalness={0} color="#ffffff" />
        </mesh>
        {/* brass picture light */}
        <mesh position={[0, 0.36, 0.06]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.014, 0.014, 0.26, 16]} />
          <meshStandardMaterial color="#b8955a" metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.33, 0.035]}>
          <boxGeometry args={[0.008, 0.06, 0.008]} />
          <meshStandardMaterial color="#b8955a" metalness={0.9} roughness={0.3} />
        </mesh>
      </group>
      <primitive object={spot} />
      <spotLight
        position={[1.42, 2.2, -0.85]}
        target={spot}
        angle={0.6}
        penumbra={1}
        intensity={1.6}
        distance={1.2}
        decay={1.5}
        color="#ffd2a1"
      />
    </group>
  )
}

export default function Room() {
  return (
    <group>
      <Walls />
      <WindowFrame />
      <Curtain x={-1.15} width={0.6} />
      <Curtain x={1.04} width={0.24} flip={-1} phase={1.7} />
      <PhotoFrame />
      <Outside />
    </group>
  )
}
