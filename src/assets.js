import * as THREE from 'three'
import { useLayoutEffect } from 'react'
import { useTexture } from '@react-three/drei'

// Asset URLs work both on Vercel (/) and GitHub Pages (/my-website/).
export const asset = (path) => `${import.meta.env.BASE_URL}assets/${path}`

// Loads a Poly Haven texture set (colour + normal + roughness) and tiles it.
export function usePBR(name, repeat = [1, 1]) {
  const t = useTexture({
    map: asset(`textures/${name}/diff.jpg`),
    normalMap: asset(`textures/${name}/nor.jpg`),
    roughnessMap: asset(`textures/${name}/rough.jpg`),
  })
  useLayoutEffect(() => {
    Object.values(t).forEach((tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping
      tex.repeat.set(repeat[0], repeat[1])
      tex.anisotropy = 8
      tex.needsUpdate = true
    })
    t.map.colorSpace = THREE.SRGBColorSpace
  }, [t, repeat[0], repeat[1]])
  return t
}
