import { useCallback, useEffect, useState } from 'react'
import Scene from './components/Scene'
import Desktop from './components/Desktop'
import useRainSound from './useRainSound'
import { profile } from './data/content'

// Wide screens show the desktop on the iMac in the picture; phones get it full screen.
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

// mode: 'room' → 'zoomIn' → 'desktop' → 'zoomOut' → 'room'
export default function App() {
  const [mode, setMode] = useState('room')
  const [simple, setSimple] = useState(false)
  const [sound, setSound] = useState(false)
  const [ready, setReady] = useState(false)
  const embedded = useEmbedded()
  useRainSound(sound)

  const onReady = useCallback(() => setReady(true), [])
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

  // fail-safe: never leave the loader up
  useEffect(() => {
    const id = setTimeout(() => setReady(true), 15000)
    return () => clearTimeout(id)
  }, [])

  const toggleSound = () => setSound((s) => !s)
  const atDesk = mode === 'desktop'
  const desktopProps = { onExit: exit, sound, onToggleSound: toggleSound }

  return (
    <>
      {!simple && (
        <Scene
          mode={mode}
          embedded={embedded}
          onEnter={enter}
          onArrive={arrive}
          onReady={onReady}
          onExit={exit}
          screenContent={embedded ? <Desktop embedded visible {...desktopProps} /> : null}
        />
      )}

      <div className={`loader ${ready || simple ? 'done' : ''}`}>
        <span>Switching on the lamp…</span>
        <div className="loader-bar">
          <span />
        </div>
      </div>

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
