import { useCallback, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { useProgress } from '@react-three/drei'
import Experience, { ROOM_POS } from './components/Experience'
import Desktop from './components/Desktop'
import useRainSound from './useRainSound'
import { profile } from './data/content'

// Wide screens show the desktop on the 3D monitor; phones get it full screen.
function useEmbedded() {
  const check = () => window.innerWidth >= 820 && window.innerHeight >= 500
  const [embedded, setEmbedded] = useState(check)
  useEffect(() => {
    const onResize = () => setEmbedded(check())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return embedded
}

function Loader({ ready }) {
  const { progress } = useProgress()
  const [timedOut, setTimedOut] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setTimedOut(true), 20000)
    return () => clearTimeout(id)
  }, [])
  const done = ready || timedOut
  return (
    <div className={`loader ${done ? 'done' : ''}`}>
      <span>Switching on the lamp…</span>
      <div className="loader-bar">
        <span style={{ width: `${Math.round(progress)}%` }} />
      </div>
    </div>
  )
}

// mode: 'room' → 'zoomIn' → 'desktop' → 'zoomOut' → 'room'
export default function App() {
  const [mode, setMode] = useState('room')
  const [simple, setSimple] = useState(false)
  const [sound, setSound] = useState(false)
  const embedded = useEmbedded()
  const [ready, setReady] = useState(false)
  const onReady = useCallback(() => setTimeout(() => setReady(true), 300), [])
  useRainSound(sound)

  const enter = useCallback(() => setMode((m) => (m === 'room' ? 'zoomIn' : m)), [])
  const arrive = useCallback((m) => setMode(m === 'zoomIn' ? 'desktop' : 'room'), [])
  const exit = useCallback(() => {
    if (simple) {
      setSimple(false)
      setMode('room')
      return
    }
    setMode((m) => (m === 'desktop' ? 'zoomOut' : m))
  }, [simple])

  const toggleSound = () => setSound((s) => !s)
  const atDesk = mode === 'desktop'
  const desktopProps = { onExit: exit, sound, onToggleSound: toggleSound }

  return (
    <>
      {!simple && (
        <Canvas
          className="scene"
          shadows
          dpr={[1, 1.75]}
          camera={{ fov: 42, near: 0.05, far: 400, position: ROOM_POS }}
          gl={{ antialias: false, powerPreference: 'high-performance' }}
          onPointerMissed={() => atDesk && embedded && exit()}
        >
          <Experience
            mode={mode}
            embedded={embedded}
            onEnter={enter}
            onArrive={arrive}
            onReady={onReady}
            screenContent={atDesk && embedded ? <Desktop embedded visible {...desktopProps} /> : null}
          />
        </Canvas>
      )}

      {!simple && <Loader ready={ready} />}

      <div className={`hud ${mode === 'room' && !simple ? 'show' : ''}`}>
        <div className="hud-top">
          <div className="brand">
            <strong>{profile.name}</strong>
            <span>{profile.role}</span>
          </div>
          <div className="hud-buttons">
            <button onClick={toggleSound}>{sound ? '🔊 Sound on' : '🔈 Sound off'}</button>
            <button
              onClick={() => {
                setSimple(true)
                setMode('desktop')
              }}
            >
              Simple view
            </button>
          </div>
        </div>
        <div className="hint">Click the computer to explore</div>
      </div>

      {atDesk && embedded && !simple && (
        <button className="back-btn" onClick={exit}>
          ← Back to room
        </button>
      )}

      <Desktop visible={simple || (atDesk && !embedded)} {...desktopProps} />
    </>
  )
}
