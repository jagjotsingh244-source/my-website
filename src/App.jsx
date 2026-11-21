import { useCallback, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import Experience, { ROOM_POS } from './components/Experience'
import Desktop from './components/Desktop'
import useRainSound from './useRainSound'
import { profile } from './data/content'

// mode: 'room' → 'zoomIn' → 'desktop' → 'zoomOut' → 'room'
export default function App() {
  const [mode, setMode] = useState('room')
  const [simple, setSimple] = useState(false)
  const [sound, setSound] = useState(false)
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

  return (
    <>
      {!simple && (
        <Canvas
          className="scene"
          shadows
          dpr={[1, 2]}
          camera={{ fov: 42, near: 0.05, far: 60, position: ROOM_POS }}
          gl={{ antialias: false }}
        >
          <Experience mode={mode} onEnter={enter} onArrive={arrive} />
        </Canvas>
      )}

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

      <Desktop visible={simple || mode === 'desktop'} onExit={exit} sound={sound} onToggleSound={toggleSound} />
    </>
  )
}
