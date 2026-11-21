import * as THREE from 'three'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { RoundedBox } from '@react-three/drei'
import { Box } from './Room'

export const DESK_TOP = 0.785

function Table() {
  const legs = [
    [-0.95, -0.42],
    [0.95, -0.42],
    [-0.95, -1.08],
    [0.95, -1.08],
  ]
  return (
    <group>
      <Box args={[2.0, 0.05, 0.78]} position={[0, 0.76, -0.75]} color="#7a5236" rough={0.55} />
      {legs.map(([x, z], i) => (
        <Box key={i} args={[0.04, 0.735, 0.04]} position={[x, 0.3675, z]} color="#151515" metal={0.6} rough={0.4} />
      ))}
      {/* desk mat */}
      <Box args={[0.95, 0.003, 0.4]} position={[0, DESK_TOP + 0.0015, -0.56]} color="#26292f" rough={1} cast={false} />
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
        <meshStandardMaterial color="#8d9098" metalness={0.5} roughness={0.4} />
      </RoundedBox>
      <instancedMesh ref={keys} args={[null, null, cols * rows]} position={[0, 0.007, 0]} castShadow>
        <boxGeometry args={[0.022, 0.005, 0.022]} />
        <meshStandardMaterial color="#a9adb5" roughness={0.7} />
      </instancedMesh>
    </group>
  )
}

function Mouse() {
  return (
    <mesh position={[0.32, DESK_TOP + 0.012, -0.52]} scale={[0.032, 0.016, 0.055]} castShadow>
      <sphereGeometry args={[1, 24, 16]} />
      <meshStandardMaterial color="#e9eaec" roughness={0.4} />
    </mesh>
  )
}

function Lamp() {
  return (
    <group>
      <mesh position={[-0.72, DESK_TOP + 0.01, -0.98]} castShadow>
        <cylinderGeometry args={[0.07, 0.075, 0.02, 32]} />
        <meshStandardMaterial color="#1b1b1d" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[-0.72, DESK_TOP + 0.22, -0.98]} castShadow>
        <cylinderGeometry args={[0.008, 0.008, 0.42, 12]} />
        <meshStandardMaterial color="#1b1b1d" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[-0.6, DESK_TOP + 0.43, -0.98]} rotation-z={Math.PI / 2 + 0.15} castShadow>
        <cylinderGeometry args={[0.007, 0.007, 0.25, 12]} />
        <meshStandardMaterial color="#1b1b1d" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[-0.49, DESK_TOP + 0.38, -0.98]} castShadow>
        <coneGeometry args={[0.085, 0.11, 32, 1, true]} />
        <meshStandardMaterial color="#c9553f" roughness={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-0.49, DESK_TOP + 0.345, -0.98]}>
        <sphereGeometry args={[0.022, 16, 16]} />
        <meshBasicMaterial color={[4, 2.6, 1.4]} toneMapped={false} />
      </mesh>
      <pointLight
        position={[-0.49, DESK_TOP + 0.3, -0.95]}
        intensity={1.6}
        distance={5}
        decay={1.6}
        color="#ffae5e"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.002}
      />
    </group>
  )
}

function Plant() {
  const leaves = useMemo(
    () =>
      Array.from({ length: 11 }, (_, i) => {
        const a = (i / 11) * Math.PI * 2 + (i % 2) * 0.3
        const tilt = 0.5 + (i % 3) * 0.25
        const len = 0.1 + (i % 4) * 0.02
        return { a, tilt, len, shade: i % 2 ? '#3f7d45' : '#4f9a55' }
      }),
    []
  )
  return (
    <group position={[0.78, DESK_TOP, -0.95]}>
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.085, 0.065, 0.16, 32]} />
        <meshStandardMaterial color="#b5653d" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.155, 0]}>
        <cylinderGeometry args={[0.078, 0.078, 0.01, 32]} />
        <meshStandardMaterial color="#2a1b12" roughness={1} />
      </mesh>
      {leaves.map((l, i) => (
        <group key={i} position={[0, 0.16, 0]} rotation={[0, l.a, 0]}>
          <group rotation={[0, 0, -l.tilt]}>
            <mesh position={[0, l.len + 0.04, 0]} scale={[0.045, l.len, 0.012]} castShadow>
              <sphereGeometry args={[1, 16, 12]} />
              <meshStandardMaterial color={l.shade} roughness={0.7} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  )
}

function Mug() {
  return (
    <group position={[0.47, DESK_TOP, -0.66]}>
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.038, 0.034, 0.1, 32]} />
        <meshStandardMaterial color="#ece6db" roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.097, 0]}>
        <cylinderGeometry args={[0.034, 0.034, 0.004, 32]} />
        <meshStandardMaterial color="#2a160c" roughness={0.2} />
      </mesh>
      <mesh position={[0.042, 0.052, 0]} castShadow>
        <torusGeometry args={[0.022, 0.006, 10, 24]} />
        <meshStandardMaterial color="#ece6db" roughness={0.35} />
      </mesh>
    </group>
  )
}

function Clutter() {
  return (
    <group>
      {/* stacked books */}
      <Box args={[0.22, 0.035, 0.16]} position={[0.5, DESK_TOP + 0.0175, -1.0]} color="#35495e" />
      <Box args={[0.2, 0.03, 0.15]} position={[0.5, DESK_TOP + 0.05, -1.0]} rotation={[0, 0.12, 0]} color="#d9a441" />
      <Box args={[0.18, 0.028, 0.14]} position={[0.5, DESK_TOP + 0.079, -1.0]} rotation={[0, -0.08, 0]} color="#b8483e" />
      {/* notebook + pen */}
      <Box args={[0.15, 0.012, 0.21]} position={[-0.42, DESK_TOP + 0.006, -0.6]} rotation={[0, 0.2, 0]} color="#c8b89a" />
      <mesh position={[-0.4, DESK_TOP + 0.016, -0.6]} rotation={[Math.PI / 2, 0, 0.9]} castShadow>
        <cylinderGeometry args={[0.004, 0.004, 0.14, 10]} />
        <meshStandardMaterial color="#1f3b73" />
      </mesh>
      {/* phone */}
      <RoundedBox args={[0.07, 0.008, 0.145]} radius={0.003} position={[-0.62, DESK_TOP + 0.004, -0.55]} rotation={[0, -0.25, 0]} castShadow>
        <meshStandardMaterial color="#111214" metalness={0.4} roughness={0.25} />
      </RoundedBox>
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
      <Mug />
      <Clutter />
    </group>
  )
}
