import { useEffect, useMemo, useRef, useState } from 'react'
import SceneCanvas from './SceneCanvas'
import CrtScreen, { ScreenGlass } from './CrtScreen'

// The room is one pre-rendered photo. Its coordinates (1x) are 2172 x 1216; the file
// itself is a 2x AI-upscaled version so it stays sharp when zoomed in. Everything
// interactive is positioned in image pixels and the whole "stage" is moved and scaled.
export const IMG = { w: 2172, h: 1216 }
// iMac display corners in image pixels: top-left, top-right, bottom-right, bottom-left
export const SCREEN_QUAD = [
  [771, 497],
  [1329, 493],
  [1327, 806],
  [775, 819],
]
export const SCREEN_PX = { w: 1024, h: 576 }
const MUG_TOP = [745, 982]
// window + fairy lights: the part drawn with live rain effects
const FX_REGION = { x: 250, y: 0, w: 1480, h: 736 }

const base = import.meta.env.BASE_URL
const ROOM_SRC = `${base}scene/room@2x.jpg`

// ── perspective mapping: CSS matrix3d that maps a w x h box onto 4 points ──
function adj(m) {
  return [
    m[4] * m[8] - m[5] * m[7], m[2] * m[7] - m[1] * m[8], m[1] * m[5] - m[2] * m[4],
    m[5] * m[6] - m[3] * m[8], m[0] * m[8] - m[2] * m[6], m[2] * m[3] - m[0] * m[5],
    m[3] * m[7] - m[4] * m[6], m[1] * m[6] - m[0] * m[7], m[0] * m[4] - m[1] * m[3],
  ]
}
function mul(a, b) {
  const c = new Array(9)
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) {
      let s = 0
      for (let k = 0; k < 3; k++) s += a[3 * i + k] * b[3 * k + j]
      c[3 * i + j] = s
    }
  return c
}
function mulv(m, v) {
  return [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]]
}
function basis(p) {
  const m = [p[0][0], p[1][0], p[2][0], p[0][1], p[1][1], p[2][1], 1, 1, 1]
  const v = mulv(adj(m), [p[3][0], p[3][1], 1])
  return mul(m, [v[0], 0, 0, 0, v[1], 0, 0, 0, v[2]])
}
export function quadMatrix(w, h, quad) {
  const [tl, tr, br, bl] = quad
  const t = mul(basis([tl, tr, bl, br]), adj(basis([[0, 0], [w, 0], [0, h], [w, h]])))
  for (let i = 0; i < 9; i++) t[i] /= t[8]
  return `matrix3d(${t[0]},${t[3]},0,${t[6]},${t[1]},${t[4]},0,${t[7]},0,0,1,0,${t[2]},${t[5]},0,${t[8]})`
}

const quadBox = (() => {
  const xs = SCREEN_QUAD.map((p) => p[0])
  const ys = SCREEN_QUAD.map((p) => p[1])
  const x0 = Math.min(...xs)
  const y0 = Math.min(...ys)
  return { x0, y0, w: Math.max(...xs) - x0, h: Math.max(...ys) - y0 }
})()

// ── camera: where the stage sits on screen { s: scale, x, y } ──
const PARALLAX = { x: 0.03, y: 0.022 } // fraction of the viewport the room drifts with the mouse
function roomView(vw, vh) {
  const portrait = vw / vh < 1.2
  // a little larger than "cover" so the mouse drift never shows an edge
  const s = Math.max(vw / IMG.w, vh / IMG.h) * (1 + PARALLAX.x * 2.4)
  const ax = portrait ? (quadBox.x0 + quadBox.w / 2) / IMG.w : 0.82
  return { s, x: (vw - IMG.w * s) * ax, y: (vh - IMG.h * s) * 0.5 }
}
function zoomView(vw, vh, embedded) {
  const s = embedded
    ? Math.min((vw * 0.7) / quadBox.w, (vh * 0.76) / quadBox.h) // leaning in: bezel + desk still visible
    : Math.max(vw / quadBox.w, vh / quadBox.h) // phones: the screen fills the view
  const cx = quadBox.x0 + quadBox.w / 2
  const cy = quadBox.y0 + quadBox.h / 2
  return { s, x: vw / 2 - cx * s, y: vh / 2 - cy * s + (embedded ? vh * 0.02 : 0) }
}
const easeInOut = (t) => (t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2) // quartic: slow start, glide, soft landing

function Steam() {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current
    const ctx = c.getContext('2d')
    const puffs = Array.from({ length: 14 }, (_, i) => ({ t: i / 14, x: (Math.random() - 0.5) * 30, w: Math.random() * 6.28 }))
    let raf
    let last = performance.now()
    const draw = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      ctx.clearRect(0, 0, c.width, c.height)
      for (const p of puffs) {
        p.t += dt * 0.12
        if (p.t > 1) {
          p.t = 0
          p.x = (Math.random() - 0.5) * 30
        }
        const y = c.height - 10 - p.t * (c.height - 30)
        const x = c.width / 2 + p.x + Math.sin(p.t * 7 + p.w) * 14 * p.t
        const r = 14 + p.t * 46
        const a = Math.sin(p.t * Math.PI) * 0.09
        const g = ctx.createRadialGradient(x, y, 0, x, y, r)
        g.addColorStop(0, `rgba(255,245,230,${a})`)
        g.addColorStop(1, 'rgba(255,245,230,0)')
        ctx.fillStyle = g
        ctx.fillRect(x - r, y - r, r * 2, r * 2)
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])
  return <canvas ref={ref} width={180} height={240} className="steam" style={{ left: MUG_TOP[0] - 90, top: MUG_TOP[1] - 230 }} />
}

// mode: 'room' | 'zoomIn' | 'desktop' | 'zoomOut'
export default function Scene({ mode, embedded, onEnter, onArrive, onReady, onExit, screenContent }) {
  const stage = useRef(null)
  const cam = useRef(null)
  const tween = useRef(null)
  const pointer = useRef({ x: 0, y: 0 })
  const latest = useRef({ mode, embedded, onArrive })
  latest.current = { mode, embedded, onArrive }
  const [showDesktop, setShowDesktop] = useState(false)

  // pointer position, -0.5..0.5
  useEffect(() => {
    const on = (e) => {
      pointer.current = { x: e.clientX / window.innerWidth - 0.5, y: e.clientY / window.innerHeight - 0.5 }
    }
    window.addEventListener('pointermove', on)
    return () => window.removeEventListener('pointermove', on)
  }, [])

  // start a zoom when the mode changes
  useEffect(() => {
    if (mode !== 'zoomIn' && mode !== 'zoomOut') return
    if (mode === 'zoomOut') setShowDesktop(false)
    const vw = window.innerWidth
    const vh = window.innerHeight
    const from = cam.current || roomView(vw, vh)
    const to = mode === 'zoomIn' ? zoomView(vw, vh, embedded) : roomView(vw, vh)
    tween.current = { start: performance.now(), dur: mode === 'zoomIn' ? 1900 : 1500, from, to, mode }
    stage.current.style.willChange = 'transform'
  }, [mode, embedded])

  // one animation loop drives the camera: zoom tweens, mouse drift, resizing
  useEffect(() => {
    let raf
    let last = performance.now()
    const smooth = { x: 0, y: 0 }
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const vw = window.innerWidth
      const vh = window.innerHeight
      const { mode: m, embedded: emb } = latest.current
      const tw = tween.current
      let v
      if (tw) {
        const p = Math.min(1, (now - tw.start) / tw.dur)
        const e = easeInOut(p)
        // zoom in log space (constant perceived speed), keep the focus point gliding
        const s = Math.exp(Math.log(tw.from.s) + (Math.log(tw.to.s) - Math.log(tw.from.s)) * e)
        const f0 = { x: (vw / 2 - tw.from.x) / tw.from.s, y: (vh / 2 - tw.from.y) / tw.from.s }
        const f1 = { x: (vw / 2 - tw.to.x) / tw.to.s, y: (vh / 2 - tw.to.y) / tw.to.s }
        const fx = f0.x + (f1.x - f0.x) * e
        const fy = f0.y + (f1.y - f0.y) * e
        v = { s, x: vw / 2 - fx * s, y: vh / 2 - fy * s }
        if (tw.mode === 'zoomIn' && p > 0.9) setShowDesktop(true)
        if (p >= 1) {
          tween.current = null
          smooth.x = 0
          smooth.y = 0
          // let the browser re-render at the final size so everything is crisp
          if (tw.mode === 'zoomIn') stage.current.style.willChange = 'auto'
          latest.current.onArrive(tw.mode)
        }
      } else if (m === 'desktop') {
        v = zoomView(vw, vh, emb)
      } else {
        // floaty mouse drift
        const k = 1 - Math.exp(-dt * 3.2)
        smooth.x += (pointer.current.x - smooth.x) * k
        smooth.y += (pointer.current.y - smooth.y) * k
        const r = roomView(vw, vh)
        v = { s: r.s, x: r.x - smooth.x * vw * PARALLAX.x * 2, y: r.y - smooth.y * vh * PARALLAX.y * 2 }
      }
      cam.current = v
      stage.current.style.transform = `translate3d(${v.x}px, ${v.y}px, 0) scale(${v.s})`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const screenTransform = useMemo(() => quadMatrix(SCREEN_PX.w, SCREEN_PX.h, SCREEN_QUAD), [])
  const deskVisible = showDesktop && screenContent

  return (
    <div
      className="scene"
      onClick={(e) => {
        // at the desk: clicking anywhere outside the iMac screen steps back
        if (mode === 'desktop' && !e.target.closest('.imac-screen')) onExit()
      }}
    >
      <div ref={stage} className="stage" style={{ width: IMG.w, height: IMG.h, willChange: 'transform' }}>
        <img
          className="room-img"
          src={ROOM_SRC}
          width={IMG.w}
          height={IMG.h}
          alt="A cosy desk by a rainy window at night, with an iMac, books and a framed photo"
          draggable={false}
          onLoad={(e) => e.currentTarget.decode?.().catch(() => {}).finally(onReady)}
        />
        <SceneCanvas imgSrc={ROOM_SRC} fxSrc={`${base}scene/room-fx.png`} imgSize={IMG} region={FX_REGION} />
        <Steam />
        {/* the iMac screen: CLICK TO ENTER in the room, the desktop once zoomed in */}
        <div
          className={`imac-screen ${mode === 'room' ? 'clickable' : ''}`}
          style={{ width: SCREEN_PX.w, height: SCREEN_PX.h, transform: screenTransform }}
          onClick={() => mode === 'room' && onEnter()}
          role={mode === 'room' ? 'button' : undefined}
          aria-label={mode === 'room' ? 'Click the computer to enter' : undefined}
        >
          <CrtScreen />
          <div className={`screen-desktop ${deskVisible ? 'on' : ''}`}>{deskVisible ? screenContent : null}</div>
          <ScreenGlass />
        </div>
      </div>
    </div>
  )
}
