import { useEffect, useMemo, useRef, useState } from 'react'
import SceneCanvas from './SceneCanvas'

// The room is one pre-rendered image (2172 x 1216). Everything interactive is
// positioned in that image's pixel coordinates and the whole "stage" is scaled
// to the window, so clicks and overlays always line up with the picture.
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

const base = import.meta.env.BASE_URL

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
  // order for the maths: TL, TR, BL, BR
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

// Where the stage sits on screen: { s: scale, x, y: translation }.
function roomView(vw, vh) {
  const portrait = vw / vh < 1.2
  const s = Math.max(vw / IMG.w, vh / IMG.h) * 1.03
  // keep the framed photo in view on wide screens, the iMac on phones
  const ax = portrait ? (quadBox.x0 + quadBox.w / 2) / IMG.w : 0.85
  return { s, x: (vw - IMG.w * s) * ax, y: (vh - IMG.h * s) * 0.5 }
}
function zoomView(vw, vh, embedded) {
  const s = embedded
    ? Math.min((vw * 0.72) / quadBox.w, (vh * 0.78) / quadBox.h) // leaning in: bezel + desk still visible
    : Math.max(vw / quadBox.w, vh / quadBox.h) // phones: the screen fills the view
  const cx = quadBox.x0 + quadBox.w / 2
  const cy = quadBox.y0 + quadBox.h / 2
  return { s, x: vw / 2 - cx * s, y: vh / 2 - cy * s + (embedded ? vh * 0.02 : 0) }
}

function useViewport() {
  const [v, setV] = useState({ w: window.innerWidth, h: window.innerHeight })
  useEffect(() => {
    const on = () => setV({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return v
}

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
  return (
    <canvas
      ref={ref}
      width={180}
      height={240}
      className="steam"
      style={{ left: MUG_TOP[0] - 90, top: MUG_TOP[1] - 230 }}
    />
  )
}

// mode: 'room' | 'zoomIn' | 'desktop' | 'zoomOut'
export default function Scene({ mode, embedded, onEnter, onArrive, onReady, onExit, screenContent }) {
  const vp = useViewport()
  const [pointer, setPointer] = useState({ x: 0, y: 0 })
  const zoomed = mode === 'zoomIn' || mode === 'desktop'

  useEffect(() => {
    if (zoomed) return
    const on = (e) => setPointer({ x: e.clientX / window.innerWidth - 0.5, y: e.clientY / window.innerHeight - 0.5 })
    window.addEventListener('pointermove', on)
    return () => window.removeEventListener('pointermove', on)
  }, [zoomed])

  const view = zoomed ? zoomView(vp.w, vp.h, embedded) : roomView(vp.w, vp.h)
  // gentle parallax in the room
  const px = zoomed ? 0 : -pointer.x * 14
  const py = zoomed ? 0 : -pointer.y * 8

  // tell the app when a zoom transition has finished
  useEffect(() => {
    if (mode !== 'zoomIn' && mode !== 'zoomOut') return
    const id = setTimeout(() => onArrive(mode), 1650)
    return () => clearTimeout(id)
  }, [mode, onArrive])

  const screenTransform = useMemo(() => quadMatrix(SCREEN_PX.w, SCREEN_PX.h, SCREEN_QUAD), [])

  return (
    <div
      className="scene"
      onClick={(e) => {
        // at the desk: clicking anywhere outside the iMac screen steps back
        if (mode === 'desktop' && !e.target.closest('.imac-screen')) onExit()
      }}
    >
      <div
        className={`stage ${mode === 'zoomIn' || mode === 'zoomOut' ? 'moving' : ''}`}
        style={{ width: IMG.w, height: IMG.h, transform: `translate(${view.x + px}px, ${view.y + py}px) scale(${view.s})` }}
      >
        <SceneCanvas imgSrc={`${base}scene/room.jpg`} fxSrc={`${base}scene/room-fx.png`} width={IMG.w} height={IMG.h} onReady={onReady} />
        <Steam />
        {/* the iMac screen: a click target in the room, the desktop once zoomed in */}
        <div
          className={`imac-screen ${mode === 'room' ? 'clickable' : ''}`}
          style={{ width: SCREEN_PX.w, height: SCREEN_PX.h, transform: screenTransform }}
          onClick={() => mode === 'room' && onEnter()}
          role={mode === 'room' ? 'button' : undefined}
          aria-label={mode === 'room' ? 'Click the computer to enter' : undefined}
        >
          {screenContent}
        </div>
      </div>
    </div>
  )
}
