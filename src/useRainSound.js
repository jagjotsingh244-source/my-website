import { useEffect, useRef } from 'react'

// Rain ambience generated in the browser (filtered noise) — no audio files needed.
export default function useRainSound(on) {
  const ref = useRef(null)

  useEffect(() => {
    if (on && !ref.current) {
      const ctx = new AudioContext()
      const len = ctx.sampleRate * 3
      const buffer = ctx.createBuffer(2, len, ctx.sampleRate)
      for (let ch = 0; ch < 2; ch++) {
        const d = buffer.getChannelData(ch)
        let last = 0
        for (let i = 0; i < len; i++) {
          const white = Math.random() * 2 - 1
          last = (last + 0.04 * white) / 1.04 // soft brown component
          d[i] = white * 0.35 + last * 2.5
        }
      }
      const src = ctx.createBufferSource()
      src.buffer = buffer
      src.loop = true
      const hp = ctx.createBiquadFilter()
      hp.type = 'highpass'
      hp.frequency.value = 400
      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 6000
      const gain = ctx.createGain()
      gain.gain.value = 0
      src.connect(hp).connect(lp).connect(gain).connect(ctx.destination)
      src.start()
      ref.current = { ctx, gain }
    }
    const s = ref.current
    if (!s) return
    if (on) s.ctx.resume()
    s.gain.gain.setTargetAtTime(on ? 0.22 : 0, s.ctx.currentTime, 0.4)
  }, [on])

  useEffect(
    () => () => {
      ref.current?.ctx.close()
      ref.current = null
    },
    []
  )
}
