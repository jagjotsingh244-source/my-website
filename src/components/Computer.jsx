import * as THREE from 'three'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, RoundedBox } from '@react-three/drei'
import { DESK_TOP } from './Desk'
import { profile } from '../data/content'

// An all-in-one desktop computer (iMac-style): thin coloured body with a chin,
// white bezel and a slanted stand. SCREEN is used by the camera to zoom in.
const PANEL_Z = -0.86
const PANEL_DEPTH = 0.014
export const SCREEN = {
  w: 0.6,
  h: 0.3375,
  center: new THREE.Vector3(0, 1.15, PANEL_Z + PANEL_DEPTH / 2 + 0.0018),
}
const BODY_COLOR = '#8ea7c2'
const BEZEL = 0.022
const CHIN = 0.078

const TEX_W = 1600
const TEX_H = 900

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// Same colours as the .desktop background in styles.css, so the hand-off is seamless.
function drawWallpaper(ctx, W, H) {
  const g = ctx.createLinearGradient(0, 0, W, H)
  g.addColorStop(0, '#0f1535')
  g.addColorStop(0.55, '#3a1f6b')
  g.addColorStop(1, '#d4567a')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
  const blob = (x, y, r, c) => {
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r)
    rg.addColorStop(0, c)
    rg.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = rg
    ctx.fillRect(0, 0, W, H)
  }
  blob(W * 0.15, H * 0.85, W * 0.35, 'rgba(70,130,255,0.45)')
  blob(W * 0.85, H * 0.15, W * 0.3, 'rgba(255,150,90,0.35)')
}

function drawLockScreen(ctx) {
  const W = TEX_W
  const H = TEX_H
  drawWallpaper(ctx, W, H)
  const now = new Date()
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  const date = now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })
  const font = '-apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.font = `500 38px ${font}`
  ctx.fillText(date, W / 2, H * 0.2)
  ctx.fillStyle = 'rgba(255,255,255,0.97)'
  ctx.font = `200 230px ${font}`
  ctx.fillText(time, W / 2, H * 0.45)
  ctx.font = `600 44px ${font}`
  ctx.fillText(profile.name, W / 2, H * 0.6)
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.font = `400 30px ${font}`
  ctx.fillText(profile.role, W / 2, H * 0.65)
  // "click to enter" pill
  const pw = 460
  const ph = 92
  roundRect(ctx, W / 2 - pw / 2, H * 0.75, pw, ph, ph / 2)
  ctx.fillStyle = 'rgba(255,255,255,0.18)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.45)'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.fillStyle = '#fff'
  ctx.font = `600 38px ${font}`
  ctx.fillText('Click to enter  →', W / 2, H * 0.75 + 60)
}

// The desktop UI is a 1024x576 web page placed onto the screen in 3D.
export const SCREEN_PX = { w: 1024, h: 576 }
// drei's <Html transform> renders 40 CSS px per world unit at scale 1.
const HTML_SCALE = SCREEN.w / (SCREEN_PX.w / 40)

export default function Computer({ interactive, onEnter, screenContent }) {
  const [hovered, setHovered] = useState(false)
  const screenMat = useRef()
  const canvas = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = TEX_W
    c.height = TEX_H
    return c
  }, [])
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  }, [canvas])

  useEffect(() => {
    const draw = () => {
      drawLockScreen(canvas.getContext('2d'))
      texture.needsUpdate = true
    }
    draw()
    const id = setInterval(draw, 10_000)
    return () => clearInterval(id)
  }, [canvas, texture])

  const active = hovered && interactive
  useEffect(() => {
    document.body.style.cursor = active ? 'pointer' : 'auto'
  }, [active])

  useFrame(({ clock }, dt) => {
    const m = screenMat.current
    if (!m) return
    const target = (active ? 1.18 : 1.0) + Math.sin(clock.elapsedTime * 2.2) * 0.03
    const v = THREE.MathUtils.damp(m.color.r, target, 8, dt)
    m.color.setScalar(v)
  })

  const alu = { color: BODY_COLOR, metalness: 0.55, roughness: 0.32 }
  const top = SCREEN.center.y + SCREEN.h / 2 + BEZEL
  const bottom = SCREEN.center.y - SCREEN.h / 2 - BEZEL - CHIN
  const bodyH = top - bottom
  const bodyW = SCREEN.w + BEZEL * 2

  return (
    <group
      onClick={(e) => {
        e.stopPropagation()
        if (interactive) onEnter()
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* body (back + coloured chin) */}
      <RoundedBox args={[bodyW, bodyH, PANEL_DEPTH]} radius={0.006} position={[0, (top + bottom) / 2, PANEL_Z]} castShadow>
        <meshStandardMaterial {...alu} />
      </RoundedBox>
      {/* white bezel around the display */}
      <mesh position={[0, SCREEN.center.y, PANEL_Z + PANEL_DEPTH / 2 + 0.0008]}>
        <planeGeometry args={[bodyW - 0.004, SCREEN.h + BEZEL * 2 - 0.002]} />
        <meshStandardMaterial color="#ecebe8" roughness={0.25} />
      </mesh>
      {/* screen */}
      <mesh position={SCREEN.center}>
        <planeGeometry args={[SCREEN.w, SCREEN.h]} />
        <meshBasicMaterial ref={screenMat} map={texture} toneMapped={false} />
      </mesh>
      {/* slanted stand + flat foot */}
      <mesh position={[0, (DESK_TOP + bottom + 0.12) / 2, PANEL_Z - 0.055]} rotation-x={0.42} castShadow>
        <boxGeometry args={[0.15, bottom + 0.12 - DESK_TOP + 0.02, 0.01]} />
        <meshStandardMaterial {...alu} />
      </mesh>
      <RoundedBox args={[0.15, 0.008, 0.17]} radius={0.003} position={[0, DESK_TOP + 0.004, PANEL_Z - 0.03]} castShadow receiveShadow>
        <meshStandardMaterial {...alu} />
      </RoundedBox>
      {/* soft light the screen throws onto the desk and keyboard */}
      <rectAreaLight
        position={[0, SCREEN.center.y, SCREEN.center.z + 0.01]}
        rotation-y={Math.PI}
        width={SCREEN.w}
        height={SCREEN.h}
        intensity={active ? 3 : 2}
        color="#a58cff"
      />
      {screenContent && (
        <Html
          transform
          position={[SCREEN.center.x, SCREEN.center.y, SCREEN.center.z + 0.001]}
          scale={HTML_SCALE}
          zIndexRange={[30, 20]}
          className="screen-html"
        >
          {screenContent}
        </Html>
      )}
    </group>
  )
}
