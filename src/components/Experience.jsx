import * as THREE from 'three'
import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import Room from './Room'
import Desk from './Desk'
import Computer, { SCREEN } from './Computer'

const ROOM_LOOK = new THREE.Vector3(0, 1.17, -1.0)
export const ROOM_POS = [0, 1.42, 1.05]

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

// Where the camera sits in the room. Narrow (portrait) screens step back a bit.
function roomView(aspect) {
  const back = aspect < 1.4 ? (1.4 - aspect) * 1.6 : 0
  return new THREE.Vector3(ROOM_POS[0], ROOM_POS[1] + back * 0.15, ROOM_POS[2] + back)
}

// Camera position where the monitor's screen exactly covers the viewport.
function screenView(camera) {
  const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
  const dH = SCREEN.h / 2 / tanHalf
  const dW = SCREEN.w / 2 / (tanHalf * camera.aspect)
  const d = Math.min(dH, dW) * 0.97
  return SCREEN.center.clone().add(new THREE.Vector3(0, 0, d))
}

function CameraRig({ mode, onArrive }) {
  const { camera, pointer } = useThree()
  const look = useRef(ROOM_LOOK.clone())
  const tween = useRef(null)

  useEffect(() => {
    if (mode !== 'zoomIn' && mode !== 'zoomOut') return
    const zoomIn = mode === 'zoomIn'
    tween.current = {
      t: 0,
      dur: zoomIn ? 1.6 : 1.3,
      fromPos: camera.position.clone(),
      fromLook: look.current.clone(),
      toPos: zoomIn ? screenView(camera) : roomView(camera.aspect),
      toLook: zoomIn ? SCREEN.center.clone() : ROOM_LOOK.clone(),
    }
  }, [mode, camera])

  useFrame((_, dt) => {
    const tw = tween.current
    if (tw) {
      tw.t = Math.min(1, tw.t + dt / tw.dur)
      const e = easeInOutCubic(tw.t)
      camera.position.lerpVectors(tw.fromPos, tw.toPos, e)
      look.current.lerpVectors(tw.fromLook, tw.toLook, e)
      camera.lookAt(look.current)
      if (tw.t >= 1) {
        tween.current = null
        onArrive(mode)
      }
      return
    }
    if (mode === 'room') {
      // gentle parallax following the mouse
      const base = roomView(camera.aspect)
      const goal = base.add(new THREE.Vector3(pointer.x * 0.12, pointer.y * 0.06, 0))
      camera.position.x = THREE.MathUtils.damp(camera.position.x, goal.x, 3, dt)
      camera.position.y = THREE.MathUtils.damp(camera.position.y, goal.y, 3, dt)
      camera.position.z = THREE.MathUtils.damp(camera.position.z, goal.z, 3, dt)
      camera.lookAt(look.current)
    } else if (mode === 'desktop') {
      camera.position.copy(screenView(camera))
      camera.lookAt(SCREEN.center)
    }
  })
  return null
}

export default function Experience({ mode, onEnter, onArrive }) {
  return (
    <>
      <color attach="background" args={['#05070f']} />
      <ambientLight intensity={0.35} color="#8a90c8" />
      <hemisphereLight args={['#6f7fd6', '#2b1e17', 0.25]} />
      {/* cool moonlight coming through the window */}
      <directionalLight position={[1.5, 4, -6]} intensity={0.5} color="#7d90ff" />

      <Room />
      <Desk />
      <Computer interactive={mode === 'room'} onEnter={onEnter} />

      <CameraRig mode={mode} onArrive={onArrive} />

      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur intensity={0.75} luminanceThreshold={0.85} luminanceSmoothing={0.2} />
        <Vignette offset={0.3} darkness={0.65} />
      </EffectComposer>
    </>
  )
}
