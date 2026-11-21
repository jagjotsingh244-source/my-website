import * as THREE from 'three'
import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useFBO } from '@react-three/drei'
import { OUTSIDE_LAYER } from './Outside'

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Original rain-on-glass shader: still droplets that come and go, drops that
// slide down leaving a clear trail, and misty (blurred) glass everywhere else.
const fragmentShader = /* glsl */ `
  uniform sampler2D tOutside;
  uniform vec2 uRes;
  uniform float uTime;
  uniform vec2 uSize;
  varying vec2 vUv;

  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  // xy = lens normal, z = mask
  vec3 dots(vec2 p, float cell, float t) {
    vec2 g = p / cell;
    vec2 id = floor(g);
    vec2 f = fract(g) - 0.5;
    float h1 = hash12(id);
    float h2 = hash12(id + 17.3);
    float h3 = hash12(id + 41.9);
    vec2 c = (vec2(h1, h2) - 0.5) * 0.6;
    float life = fract(t * (0.03 + h3 * 0.05) + h1);
    float alive = smoothstep(0.0, 0.04, life) * (1.0 - smoothstep(0.55, 1.0, life));
    float r = mix(0.12, 0.3, h3) * alive * step(0.3, h2);
    vec2 d = f - c;
    float m = smoothstep(r, r * 0.7, length(d));
    return vec3(d / max(r, 1e-3), m);
  }

  // xy = lens normal, z = drop mask, w = clear trail mask
  vec4 sliders(vec2 p, float t) {
    float colW = 0.05;
    float col = floor(p.x / colW);
    float h = hash12(vec2(col, 3.7));
    float h2 = hash12(vec2(col, 9.1));
    float speed = 0.04 + h * 0.1;
    float cycleLen = uSize.y + 0.8;
    float travel = t * speed + h2 * 10.0;
    float cycle = floor(travel / cycleLen);
    float isOn = step(0.5, hash12(vec2(col, cycle)));
    float y = uSize.y + 0.3 - mod(travel, cycleLen);
    y += sin(t * (1.3 + h) + h * 6.28) * 0.008;
    float x = (col + 0.5) * colW + sin(p.y * 16.0 + h * 6.28) * 0.005 + (h2 - 0.5) * 0.02;
    float r = 0.006 + h2 * 0.006;
    vec2 d = vec2(p.x - x, (p.y - y) * 0.7);
    float drop = smoothstep(r, r * 0.55, length(d)) * isOn;
    float above = p.y - y;
    float trail = smoothstep(r * 0.6, r * 0.15, abs(p.x - x))
      * smoothstep(0.0, 0.012, above)
      * (1.0 - smoothstep(0.06, 0.4, above)) * isOn;
    vec2 tg = vec2(p.x - x, p.y) / 0.01;
    vec2 tf = fract(tg) - 0.5;
    float th = hash12(floor(tg) + col);
    float tdrop = smoothstep(0.28, 0.16, length(tf)) * step(0.5, th) * trail;
    vec2 n = (d / r) * drop + tf * 2.0 * tdrop;
    return vec4(n, max(drop, tdrop), trail);
  }

  void main() {
    vec2 p = vUv * uSize;
    float t = uTime;
    vec3 s1 = dots(p, 0.016, t);
    vec3 s2 = dots(p + 3.1, 0.03, t * 0.7);
    vec4 sl = sliders(p, t);
    vec2 n = s1.xy * s1.z * 0.7 + s2.xy * s2.z + sl.xy;
    float dropMask = clamp(max(max(s1.z, s2.z), sl.z), 0.0, 1.0);
    float clear = clamp(max(dropMask, sl.w * 0.85), 0.0, 1.0);

    vec2 suv = gl_FragCoord.xy / uRes;
    vec3 blur = vec3(0.0);
    float rad = 0.0035;
    for (int i = 0; i < 16; i++) {
      float fi = float(i);
      float a = fi * 2.39996;
      float rr = sqrt((fi + 0.5) / 16.0) * rad;
      blur += texture2D(tOutside, suv + vec2(cos(a), sin(a) * uRes.x / uRes.y) * rr).rgb;
    }
    blur /= 16.0;
    vec3 misty = blur * 0.95 + vec3(0.006, 0.006, 0.01);

    // drops act like tiny lenses, so they show a flipped, sharper view
    vec3 sharp = texture2D(tOutside, suv - n * 0.014).rgb;
    vec3 col = mix(misty, sharp, clear);

    float ln = length(n);
    float rim = smoothstep(0.55, 1.0, ln) * dropMask;
    col *= 1.0 - rim * 0.4;
    float spec = smoothstep(0.8, 0.97, dot(normalize(n + 1e-4), normalize(vec2(-0.45, 0.6))));
    col += vec3(1.0, 0.82, 0.62) * spec * dropMask * ln * 0.35;

    // night city reads less saturated through wet glass
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(col, vec3(lum) * vec3(1.0, 0.96, 0.9), 0.3);
    // faint reflection of the warm room on the inside of the glass
    col += vec3(1.0, 0.62, 0.32) * 0.025 * smoothstep(0.8, 0.0, vUv.x) * smoothstep(1.0, 0.1, vUv.y);
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`

export default function RainGlass({ size = [1.75, 1.25], ...props }) {
  const fbo = useFBO({ type: THREE.HalfFloatType })
  const res = useMemo(() => new THREE.Vector2(), [])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          tOutside: { value: fbo.texture },
          uRes: { value: new THREE.Vector2(1, 1) },
          uTime: { value: 0 },
          uSize: { value: new THREE.Vector2(size[0], size[1]) },
        },
        vertexShader,
        fragmentShader,
        toneMapped: false,
      }),
    [fbo, size[0], size[1]]
  )

  // Render only the outside world (layer 1) into the buffer the glass samples.
  useFrame(({ gl, scene, camera, clock }) => {
    gl.getDrawingBufferSize(res)
    if (fbo.width !== res.x || fbo.height !== res.y) fbo.setSize(res.x, res.y)
    material.uniforms.uRes.value.copy(res)
    material.uniforms.uTime.value = clock.elapsedTime
    const mask = camera.layers.mask
    const autoShadows = gl.shadowMap.autoUpdate
    gl.shadowMap.autoUpdate = false
    camera.layers.set(OUTSIDE_LAYER)
    gl.setRenderTarget(fbo)
    gl.clear()
    gl.render(scene, camera)
    gl.setRenderTarget(null)
    camera.layers.mask = mask
    gl.shadowMap.autoUpdate = autoShadows
  })

  return (
    <mesh material={material} {...props}>
      <planeGeometry args={size} />
    </mesh>
  )
}
