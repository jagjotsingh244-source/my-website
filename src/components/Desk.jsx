import * as THREE from 'three'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox, useGLTF } from '@react-three/drei'
import { asset, usePBR } from '../assets'
import { bookSpines } from '../data/content'
import { Box } from './Room'

export const DESK_TOP = 0.785

function useModel(path) {
  const { scene } = useGLTF(asset(path))
  const model = useMemo(() => scene.clone(true), [scene])
  useLayoutEffect(() => {
    model.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true
        o.receiveShadow = true
      }
    })
  }, [model])
  return model
}

function Table() {
  const oak = usePBR('oak_veneer_01', [1.2, 0.5])
  const legs = [
    [-0.95, -0.42],
    [0.95, -0.42],
    [-0.95, -1.08],
    [0.95, -1.08],
  ]
  return (
    <group>
      <mesh position={[0, 0.76, -0.75]} castShadow receiveShadow>
        <boxGeometry args={[2.0, 0.05, 0.78]} />
        <meshStandardMaterial {...oak} color="#7a5a44" normalScale={[0.3, 0.3]} envMapIntensity={0.6} />
      </mesh>
      {legs.map(([x, z], i) => (
        <Box key={i} args={[0.04, 0.735, 0.04]} position={[x, 0.3675, z]} color="#1c1c1e" metal={0.6} rough={0.4} />
      ))}
      {/* felt desk mat */}
          </group>
  )
}

function Keyboard() {
  const keys = useRef()
  const cols = 14
  const rows = 5
  const step = 0.027
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    let i = 0
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        m.setPosition((c - (cols - 1) / 2) * step, 0, (r - (rows - 1) / 2) * step)
        keys.current.setMatrixAt(i++, m)
      }
    }
    keys.current.instanceMatrix.needsUpdate = true
  }, [])
  return (
    <group position={[0, DESK_TOP + 0.006, -0.6]} rotation-x={0.04}>
      <RoundedBox args={[0.4, 0.01, 0.155]} radius={0.004} castShadow receiveShadow>
        <meshStandardMaterial color="#c9ccd2" metalness={0.6} roughness={0.3} />
      </RoundedBox>
      <instancedMesh ref={keys} args={[null, null, cols * rows]} position={[0, 0.007, 0]} castShadow>
        <boxGeometry args={[0.022, 0.005, 0.022]} />
        <meshStandardMaterial color="#f3f3f5" roughness={0.5} />
      </instancedMesh>
    </group>
  )
}

function Mouse() {
  return (
    <mesh position={[0.3, DESK_TOP + 0.012, -0.6]} scale={[0.032, 0.014, 0.055]} castShadow>
      <sphereGeometry args={[1, 24, 16]} />
      <meshStandardMaterial color="#f1f1f3" roughness={0.3} metalness={0.1} />
    </mesh>
  )
}

function Lamp() {
  const model = useModel('models/desk_lamp_arm_01/desk_lamp_arm_01_1k.gltf')
  const target = useMemo(() => {
    const o = new THREE.Object3D()
    o.position.set(-0.3, DESK_TOP, -0.6)
    return o
  }, [])
  // The clamp sits on the back edge of the desk; the head reaches over the desk.
  return (
    <>
    <primitive object={target} />
    <group position={[-0.5, DESK_TOP, -0.86]} rotation-y={Math.PI + 0.35} scale={0.72}>
      <primitive object={model} />
      {/* bulb sits at roughly (0, 0.69, -0.18) in the model */}
      <group position={[0, 0.66, -0.18]}>
        <spotLight
          target={target}
          angle={0.85}
          penumbra={0.9}
          intensity={16}
          distance={4}
          decay={1.5}
          color="#ffb46e"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0005}
          shadow-normalBias={0.02}
          shadow-radius={6}
        />
        <pointLight intensity={0.35} distance={3} decay={1.5} color="#ffb46e" />
      </group>
    </group>
    </>
  )
}

function Plant() {
  const model = useModel('models/potted_plant_02/potted_plant_02_1k.gltf')
  return <primitive object={model} position={[-0.84, DESK_TOP, -0.66]} scale={0.95} rotation-y={0.9} />
}

function Clock() {
  const model = useModel('models/alarm_clock_01/alarm_clock_01_1k.gltf')
  return <primitive object={model} position={[0.9, DESK_TOP, -0.98]} rotation-y={-0.5} scale={0.95} />
}

function Steam() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 64
    const ctx = c.getContext('2d')
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    g.addColorStop(0, 'rgba(255,255,255,0.5)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 64, 64)
    return new THREE.CanvasTexture(c)
  }, [])
  const puffs = useRef()
  useFrame(({ clock }) => {
    puffs.current.children.forEach((s, i) => {
      const t = (clock.elapsedTime * 0.25 + i / 6) % 1
      s.position.set(Math.sin(t * 6 + i) * 0.012, t * 0.18, 0)
      s.scale.setScalar(0.03 + t * 0.06)
      s.material.opacity = Math.sin(t * Math.PI) * 0.16
    })
  })
  return (
    <group ref={puffs} position={[0, 0.11, 0]}>
      {Array.from({ length: 6 }, (_, i) => (
        <sprite key={i}>
          <spriteMaterial map={tex} transparent depthWrite={false} color="#fff3e6" />
        </sprite>
      ))}
    </group>
  )
}

function Mug() {
  return (
    <group position={[-0.2, DESK_TOP, -0.48]}>
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.038, 0.035, 0.1, 40]} />
        <meshPhysicalMaterial color="#e9e3d8" roughness={0.25} clearcoat={0.8} clearcoatRoughness={0.15} />
      </mesh>
      <mesh position={[0, 0.093, 0]}>
        <cylinderGeometry args={[0.034, 0.034, 0.004, 40]} />
        <meshPhysicalMaterial color="#2a150a" roughness={0.1} clearcoat={1} />
      </mesh>
      <mesh position={[0.043, 0.052, 0]} castShadow>
        <torusGeometry args={[0.022, 0.006, 12, 28]} />
        <meshPhysicalMaterial color="#e9e3d8" roughness={0.25} clearcoat={0.8} />
      </mesh>
      <Steam />
    </group>
  )
}

// Book lying flat with its spine (label) facing the room.
function makeSpine(label, color, ink) {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 64
  const ctx = c.getContext('2d')
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 512, 64)
  ctx.fillStyle = 'rgba(0,0,0,0.18)'
  ctx.fillRect(0, 0, 512, 5)
  ctx.fillRect(0, 59, 512, 5)
  ctx.fillStyle = ink
  ctx.font = '800 30px Helvetica, Arial, sans-serif'
  ctx.textBaseline = 'middle'
  ctx.fillText(label.toUpperCase(), 70, 33)
  ctx.globalAlpha = 0.6
  ctx.fillRect(28, 20, 24, 24)
  ctx.font = '600 16px Helvetica, Arial, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText('2026', 490, 33)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

function Book({ label, color, ink = '#f6f1e6', w = 0.26, h = 0.034, d = 0.18, position, rotY = 0 }) {
  const mats = useMemo(() => {
    const paper = new THREE.MeshStandardMaterial({ color: '#efe5cf', roughness: 0.95 })
    const cover = new THREE.MeshStandardMaterial({ color, roughness: 0.6 })
    const spine = new THREE.MeshStandardMaterial({ map: makeSpine(label, color, ink), roughness: 0.55 })
    return [paper, paper, cover, cover, spine, paper]
  }, [label, color, ink])
  return (
    <mesh position={position} rotation-y={rotY} material={mats} castShadow receiveShadow>
      <boxGeometry args={[w, h, d]} />
    </mesh>
  )
}

function BookStack({ books, position, spin = 0 }) {
  let y = 0
  return (
    <group position={position} rotation-y={spin}>
      {books.map((b, i) => {
        const h = b.h ?? 0.03 + ((i * 7) % 3) * 0.006
        const el = <Book key={b.label} {...b} h={h} position={[((i * 13) % 5) * 0.006 - 0.012, y + h / 2, 0]} rotY={(((i * 17) % 7) - 3) * 0.02} />
        y += h
        return el
      })}
    </group>
  )
}

function Glasses({ position, rotY = 0 }) {
  const metal = <meshStandardMaterial color="#2a2522" metalness={0.8} roughness={0.3} />
  const lens = <meshPhysicalMaterial color="#ffffff" transmission={0.9} roughness={0.05} thickness={0.002} transparent opacity={0.35} />
  return (
    <group position={position} rotation-y={rotY}>
      {[-0.034, 0.034].map((x) => (
        <group key={x} position={[x, 0.028, 0]} rotation-x={-1.2}>
          <mesh castShadow>
            <torusGeometry args={[0.026, 0.0022, 8, 40]} />
            {metal}
          </mesh>
          <mesh>
            <circleGeometry args={[0.025, 32]} />
            {lens}
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.034, 0.006]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.0018, 0.0018, 0.018, 8]} />
        {metal}
      </mesh>
      {[-0.06, 0.06].map((x) => (
        <mesh key={x} position={[x, 0.004, -0.055]} rotation-x={0.08}>
          <boxGeometry args={[0.003, 0.003, 0.12]} />
          {metal}
        </mesh>
      ))}
    </group>
  )
}

function LabelPlane({ text, size, position, rotation, color = '#3b2a12' }) {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 512
    c.height = 160
    const ctx = c.getContext('2d')
    ctx.fillStyle = color
    ctx.font = '900 96px Helvetica, Arial, sans-serif'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 16, 84)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [text, color])
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={size} />
      <meshStandardMaterial map={tex} transparent roughness={0.8} />
    </mesh>
  )
}

function PencilCup() {
  const pencils = [
    ['#e0b13a', 0.12, 0.2],
    ['#2f5d8a', -0.1, 0.15],
    ['#c0392b', 0.05, -0.18],
    ['#1d1d1f', -0.16, -0.05],
  ]
  return (
    <group position={[-0.6, DESK_TOP, -0.44]}>
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.035, 0.032, 0.1, 32]} />
        <meshStandardMaterial color="#8d8f8c" metalness={0.6} roughness={0.35} />
      </mesh>
      {pencils.map(([c, rx, rz], i) => (
        <mesh key={i} position={[rz * 0.06, 0.12, rx * 0.06]} rotation={[rx, 0, rz]} castShadow>
          <cylinderGeometry args={[0.0035, 0.0035, 0.17, 8]} />
          <meshStandardMaterial color={c} roughness={0.6} />
        </mesh>
      ))}
    </group>
  )
}

function Clutter() {
  return (
    <group>
      {/* leather planner + pen */}
      <Box args={[0.17, 0.018, 0.23]} position={[-0.38, DESK_TOP + 0.009, -0.46]} rotation={[0, 0.18, 0]} color="#5a3a24" rough={0.6} />
      <Box args={[0.16, 0.003, 0.22]} position={[-0.37, DESK_TOP + 0.0195, -0.46]} rotation={[0, 0.18, 0]} color="#f2ead9" cast={false} />
      <mesh position={[-0.34, DESK_TOP + 0.025, -0.47]} rotation={[Math.PI / 2, 0, 1.1]} castShadow>
        <cylinderGeometry args={[0.004, 0.004, 0.14, 12]} />
        <meshStandardMaterial color="#1b1b1d" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* phone */}
      <RoundedBox args={[0.072, 0.008, 0.148]} radius={0.003} position={[0.3, DESK_TOP + 0.004, -0.42]} rotation={[0, 0.3, 0]} castShadow>
        <meshPhysicalMaterial color="#0e0f11" metalness={0.3} roughness={0.15} clearcoat={1} />
      </RoundedBox>
      {/* papers + a projects folder on the right */}
      <Box args={[0.21, 0.002, 0.29]} position={[0.66, DESK_TOP + 0.001, -0.5]} rotation={[0, -0.35, 0]} color="#f4efe6" cast={false} />
      <Box args={[0.21, 0.002, 0.29]} position={[0.74, DESK_TOP + 0.003, -0.55]} rotation={[0, -0.12, 0]} color="#eee7da" cast={false} />
      <Box args={[0.25, 0.006, 0.33]} position={[0.5, DESK_TOP + 0.003, -0.6]} rotation={[0, 0.55, 0]} color="#e3c27b" rough={0.8} />
      <LabelPlane text="PROJECTS" size={[0.16, 0.05]} position={[0.5, DESK_TOP + 0.0065, -0.6]} rotation={[-Math.PI / 2, 0, 0.55 + Math.PI / 2]} />
      <Glasses position={[0.82, DESK_TOP + 0.004, -0.46]} rotY={-0.5} />
    </group>
  )
}

const PALETTE = [
  ['#2f4f8f', '#f6f1e6'],
  ['#c8553d', '#f6f1e6'],
  ['#e9c46a', '#2b2118'],
  ['#2a9d8f', '#f6f1e6'],
  ['#6d4c9f', '#f6f1e6'],
  ['#efe6d2', '#2b2118'],
  ['#1f3b2d', '#e9c46a'],
  ['#9b2c2c', '#f6f1e6'],
  ['#3d5a80', '#f6f1e6'],
  ['#f4a261', '#2b2118'],
  ['#264653', '#f6f1e6'],
]
const spines = bookSpines.slice(0, 11).map((label, i) => ({
  label,
  color: PALETTE[i % PALETTE.length][0],
  ink: PALETTE[i % PALETTE.length][1],
  w: 0.24 + ((i * 7) % 5) * 0.012,
}))

export default function Desk() {
  return (
    <group>
      <Table />
      <Keyboard />
      <Mouse />
      <Lamp />
      <Plant />
      <Clock />
      <Mug />
      <PencilCup />
      <Clutter />
      <BookStack position={[0.47, DESK_TOP, -0.9]} spin={0.05} books={spines.slice(0, 6)} />
      <BookStack position={[0.73, DESK_TOP, -0.86]} spin={-0.1} books={spines.slice(6, 11)} />
    </group>
  )
}
