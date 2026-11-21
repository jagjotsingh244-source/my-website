import * as THREE from 'three'
import { Suspense, useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, N8AO, Noise, BrightnessContrast, HueSaturation } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'
import Room from './Room'
import Desk from './Desk'
import Computer, { SCREEN } from './Computer'
import { SKY_COLOR } from './Outside'
import { asset } from '../assets'

RectAreaLightUniformsLib.init()

const ROOM_LOOK = new THREE.Vector3(0.16, 1.24, -1.1)
export const ROOM_POS = [0.26, 1.24, 1.02]

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

// Where the camera sits in the room. Narrow (portrait) screens step back a bit.
function roomView(aspect) {
  const back = aspect < 1.4 ? (1.4 - aspect) * 1.6 : 0
  return new THREE.Vector3(ROOM_POS[0], ROOM_POS[1] + back * 0.15, ROOM_POS[2] + back)
}

const tanHalf = (camera) => Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))

// Like leaning in towards the monitor: it fills most of the view,
// but you still see the bezel, stand and the desk around it.
function eyeView(camera) {
  const dW = SCREEN.w / (0.74 * 2 * tanHalf(camera) * camera.aspect)
  const dH = SCREEN.h / (0.8 * 2 * tanHalf(camera))
  return SCREEN.center.clone().add(new THREE.Vector3(0, 0.01, Math.max(dW, dH)))
}

// Phones: the screen covers the whole viewport and the HTML desktop takes over.
function screenView(camera) {
  const dH = SCREEN.h / 2 / tanHalf(camera)
  const dW = SCREEN.w / 2 / (tanHalf(camera) * camera.aspect)
  return SCREEN.center.clone().add(new THREE.Vector3(0, 0, Math.min(dH, dW) * 0.97))
}

function CameraRig({ mode, embedded, onArrive }) {
  const { camera, pointer } = useThree()
  const look = useRef(ROOM_LOOK.clone())
  const tween = useRef(null)
  const closeView = embedded ? eyeView : screenView

  useEffect(() => {
    if (mode !== 'zoomIn' && mode !== 'zoomOut') return
    const zoomIn = mode === 'zoomIn'
    tween.current = {
      t: 0,
      dur: zoomIn ? 1.8 : 1.4,
      fromPos: camera.position.clone(),
      fromLook: look.current.clone(),
      toPos: zoomIn ? closeView(camera) : roomView(camera.aspect),
      toLook: zoomIn ? SCREEN.center.clone() : ROOM_LOOK.clone(),
    }
  }, [mode, camera, closeView])

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
      const goal = roomView(camera.aspect).add(new THREE.Vector3(pointer.x * 0.12, pointer.y * 0.06, 0))
      camera.position.x = THREE.MathUtils.damp(camera.position.x, goal.x, 3, dt)
      camera.position.y = THREE.MathUtils.damp(camera.position.y, goal.y, 3, dt)
      camera.position.z = THREE.MathUtils.damp(camera.position.z, goal.z, 3, dt)
      camera.lookAt(look.current)
    } else if (mode === 'desktop') {
      camera.position.copy(closeView(camera))
      look.current.copy(SCREEN.center)
      camera.lookAt(SCREEN.center)
    }
  })
  return null
}

// Mounts only once everything inside <Suspense> has loaded.
function Ready({ onReady }) {
  useEffect(() => {
    onReady?.()
  }, [onReady])
  return null
}

export default function Experience({ mode, embedded, onEnter, onArrive, screenContent, onReady }) {
  return (
    <>
      <color attach="background" args={[SKY_COLOR]} />
      <ambientLight intensity={0.22} color="#ffcf9e" />
      <hemisphereLight args={['#ffd8a8', '#3a2414', 0.35]} />
      {/* warm room light from off-screen, behind the viewer */}
      <pointLight position={[0.8, 2.3, 0.6]} intensity={1.4} distance={5} decay={1.6} color="#ffb877" />
      {/* cool city light coming in through the window */}
      <rectAreaLight position={[0, 1.65, -1.12]} rotation-y={Math.PI} width={1.75} height={1.25} intensity={0.7} color="#8fa2ff" />

      <Suspense fallback={null}>
        <Environment files={asset('hdri/room_1k.hdr')} environmentIntensity={0.3} />
        <Room />
        <Desk />
        <Computer interactive={mode === 'room'} onEnter={onEnter} screenContent={screenContent} />
        <Ready onReady={onReady} />
      </Suspense>

      <CameraRig mode={mode} embedded={embedded} onArrive={onArrive} />

      <EffectComposer multisampling={0}>
        <N8AO halfRes aoRadius={0.3} intensity={2.2} distanceFalloff={0.5} />
        <Bloom mipmapBlur intensity={0.7} luminanceThreshold={0.9} luminanceSmoothing={0.25} />
        <HueSaturation saturation={-0.08} />
        <BrightnessContrast brightness={0.02} contrast={0.08} />
        <Noise premultiply blendFunction={BlendFunction.SCREEN} opacity={0.35} />
        <Vignette offset={0.3} darkness={0.62} />
      </EffectComposer>
    </>
  )
}
