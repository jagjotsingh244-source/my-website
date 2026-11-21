import * as THREE from 'three'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox, useGLTF } from '@react-three/drei'
import { asset, usePBR } from '../assets'
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
      <Box args={[0.95, 0.003, 0.4]} position={[0, DESK_TOP + 0.0015, -0.56]} color="#3a3d44" rough={1} cast={false} />
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
    <group position={[0, DESK_TOP + 0.006, -0.52]} rotation-x={0.04}>
      <RoundedBox args={[0.4, 0.01, 0.155]} radius={0.004} castShadow receiveShadow>
        <meshStandardMaterial color="#5c5f66" metalness={0.8} roughness={0.35} />
      </RoundedBox>
      <instancedMesh ref={keys} args={[null, null, cols * rows]} position={[0, 0.007, 0]} castShadow>
        <boxGeometry args={[0.022, 0.005, 0.022]} />
        <meshStandardMaterial color="#26282c" roughness={0.6} />
      </instancedMesh>
    </group>
  )
}

function Mouse() {
  return (
    <mesh position={[0.32, DESK_TOP + 0.012, -0.52]} scale={[0.032, 0.016, 0.055]} castShadow>
      <sphereGeometry args={[1, 24, 16]} />
      <meshStandardMaterial color="#2b2d31" roughness={0.35} metalness={0.2} />
    </mesh>
  )
}

function Lamp() {
  const model = useModel('models/desk_lamp_arm_01/desk_lamp_arm_01_1k.gltf')
  const target = useMemo(() => {
    const o = new THREE.Object3D()
    o.position.set(-0.4, DESK_TOP, -0.62)
    return o
  }, [])
  // The clamp sits on the back edge of the desk; the head reaches over the desk.
  return (
    <>
    <primitive object={target} />
    <group position={[-0.72, DESK_TOP, -0.82]} rotation-y={Math.PI + 0.55} scale={0.82}>
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
  return <primitive object={model} position={[0.78, DESK_TOP, -0.93]} scale={0.55} rotation-y={0.6} />
}

function Clock() {
  const model = useModel('models/alarm_clock_01/alarm_clock_01_1k.gltf')
  return <primitive object={model} position={[0.56, DESK_TOP, -0.98]} rotation-y={-0.45} scale={0.9} />
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
    <group position={[0.45, DESK_TOP, -0.64]}>
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

function Clutter() {
  return (
    <group>
      {/* notebook + pen */}
      <Box args={[0.15, 0.012, 0.21]} position={[-0.42, DESK_TOP + 0.006, -0.6]} rotation={[0, 0.2, 0]} color="#c7b48e" />
      <Box args={[0.148, 0.002, 0.205]} position={[-0.42, DESK_TOP + 0.0125, -0.6]} rotation={[0, 0.2, 0]} color="#f3ede0" cast={false} />
      <mesh position={[-0.4, DESK_TOP + 0.017, -0.6]} rotation={[Math.PI / 2, 0, 0.9]} castShadow>
        <cylinderGeometry args={[0.004, 0.004, 0.14, 12]} />
        <meshStandardMaterial color="#1f3b73" metalness={0.4} roughness={0.3} />
      </mesh>
      {/* phone */}
      <RoundedBox args={[0.072, 0.008, 0.148]} radius={0.003} position={[-0.6, DESK_TOP + 0.004, -0.5]} rotation={[0, -0.25, 0]} castShadow>
        <meshPhysicalMaterial color="#0e0f11" metalness={0.3} roughness={0.15} clearcoat={1} />
      </RoundedBox>
      {/* two hardback books */}
      <Box args={[0.21, 0.03, 0.15]} position={[0.36, DESK_TOP + 0.015, -1.0]} rotation={[0, 0.1, 0]} color="#2f4a5e" rough={0.7} />
      <Box args={[0.19, 0.026, 0.14]} position={[0.36, DESK_TOP + 0.043, -1.0]} rotation={[0, -0.06, 0]} color="#8c3b32" rough={0.7} />
    </group>
  )
}

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
      <Clutter />
    </group>
  )
}
