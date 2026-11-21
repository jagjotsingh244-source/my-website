import { useEffect, useRef } from 'react'

// Draws the room image with live effects on top, using a small WebGL shader:
// rain drops sliding down the window, falling rain, twinkling fairy lights and
// shimmering city lights. room-fx.png says where: R = glass, G = fairy lights, B = city lights.

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = vec2((aPos.x + 1.0) * 0.5, 1.0 - (aPos.y + 1.0) * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`

const FRAG = `
precision highp float;
uniform sampler2D uImg;
uniform sampler2D uFx;
uniform float uTime;
uniform vec2 uRes;
varying vec2 vUv;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

// little drops stuck to the glass that appear and evaporate (xy = lens normal, z = mask)
vec3 dots(vec2 px, float cell, float t) {
  vec2 id = floor(px / cell);
  vec2 f = fract(px / cell) - 0.5;
  float h1 = hash(id), h2 = hash(id + 17.3), h3 = hash(id + 41.9);
  vec2 c = (vec2(h1, h2) - 0.5) * 0.6;
  float life = fract(t * (0.03 + h3 * 0.05) + h1);
  float alive = smoothstep(0.0, 0.04, life) * (1.0 - smoothstep(0.55, 1.0, life));
  float r = mix(0.1, 0.26, h3) * alive * step(0.35, h2);
  vec2 d = f - c;
  return vec3(d / max(r, 1e-3), smoothstep(r, r * 0.7, length(d)));
}

// drops sliding down with a clear trail (xy = normal, z = drop, w = trail)
vec4 sliders(vec2 px, float t) {
  float colW = 26.0;
  float col = floor(px.x / colW);
  float h = hash(vec2(col, 3.7));
  float h2 = hash(vec2(col, 9.1));
  float speed = 22.0 + h * 55.0;
  float span = uRes.y + 300.0;
  float travel = t * speed + h2 * 4000.0;
  float isOn = step(0.55, hash(vec2(col, floor(travel / span))));
  float y = mod(travel, span) - 150.0;
  y += sin(t * (1.2 + h) + h * 6.28) * 2.0;
  float x = (col + 0.5) * colW + sin(px.y * 0.045 + h * 6.28) * 3.0 + (h2 - 0.5) * 8.0;
  float r = 2.6 + h2 * 2.6;
  vec2 d = vec2(px.x - x, (px.y - y) * 0.7);
  float drop = smoothstep(r, r * 0.55, length(d)) * isOn;
  float behind = y - px.y;
  float trail = smoothstep(r * 0.6, r * 0.15, abs(px.x - x))
    * smoothstep(0.0, 6.0, behind) * (1.0 - smoothstep(30.0, 160.0, behind)) * isOn;
  return vec4((d / r) * drop, drop, trail);
}

// rain falling outside, thin slanted streaks
float streaks(vec2 px, float t) {
  vec2 q = vec2(px.x + px.y * 0.1, px.y);
  float colW = 7.0;
  float col = floor(q.x / colW);
  float h = hash(vec2(col, 1.3));
  float speed = 700.0 + h * 500.0;
  float period = 260.0 + h * 240.0;
  float s = fract((q.y - t * speed) / period + h * 7.0);
  float seg = smoothstep(0.0, 0.03, s) * (1.0 - smoothstep(0.06, 0.16, s));
  float thin = 1.0 - smoothstep(0.0, 0.7, abs(fract(q.x / colW) - 0.5) * colW);
  return seg * thin * step(0.72, hash(vec2(col, 5.1)));
}

void main() {
  vec2 uv = vUv;
  vec4 fx = texture2D(uFx, uv);
  float glass = fx.r;
  vec2 px = uv * uRes;
  float t = uTime;

  vec2 n = vec2(0.0);
  float dropMask = 0.0;
  float rain = 0.0;
  if (glass > 0.01) {
    vec3 s1 = dots(px, 14.0, t);
    vec3 s2 = dots(px + 31.0, 24.0, t * 0.7);
    vec4 sl = sliders(px, t);
    n = s1.xy * s1.z * 0.7 + s2.xy * s2.z + sl.xy;
    dropMask = clamp(max(max(s1.z, s2.z), sl.z), 0.0, 1.0) * glass;
    rain = streaks(px, t) * glass;
  }

  vec3 col = texture2D(uImg, uv - n * glass * 5.0 / uRes).rgb;
  float ln = length(n);
  col *= 1.0 - smoothstep(0.55, 1.0, ln) * dropMask * 0.35;
  float spec = smoothstep(0.8, 0.97, dot(normalize(n + 1e-4), normalize(vec2(-0.45, -0.6))));
  col += vec3(1.0, 0.85, 0.65) * spec * dropMask * ln * 0.25;
  col += vec3(0.75, 0.8, 0.85) * rain * 0.16;

  // fairy lights: each bulb gently breathes at its own pace
  float hb = hash(floor(px / 16.0));
  float tw = 0.5 + 0.5 * sin(t * (0.8 + hb * 1.8) + hb * 40.0);
  col += col * fx.g * (tw * 0.6 - 0.2);

  // distant city lights shimmer through the rain
  float hc = hash(floor(px / 9.0) + 7.0);
  col *= 1.0 + fx.b * 0.3 * sin(t * (0.5 + hc * 1.6) + hc * 30.0);

  gl_FragColor = vec4(col, 1.0);
}`

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export default function SceneCanvas({ imgSrc, fxSrc, width, height, onReady }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    let raf = 0
    let disposed = false
    const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false })

    Promise.all([loadImage(imgSrc), loadImage(fxSrc)])
      .then(([img, fx]) => {
        if (disposed) return
        if (!gl) {
          // no WebGL: just show the still image
          canvas.getContext('2d')?.drawImage(img, 0, 0, width, height)
          onReady?.()
          return
        }
        const sh = (type, src) => {
          const s = gl.createShader(type)
          gl.shaderSource(s, src)
          gl.compileShader(s)
          if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s))
          return s
        }
        const prog = gl.createProgram()
        gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT))
        gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG))
        gl.linkProgram(prog)
        gl.useProgram(prog)

        const buf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buf)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
        const loc = gl.getAttribLocation(prog, 'aPos')
        gl.enableVertexAttribArray(loc)
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

        const tex = (image, unit) => {
          const t = gl.createTexture()
          gl.activeTexture(gl.TEXTURE0 + unit)
          gl.bindTexture(gl.TEXTURE_2D, t)
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        }
        tex(img, 0)
        tex(fx, 1)
        gl.uniform1i(gl.getUniformLocation(prog, 'uImg'), 0)
        gl.uniform1i(gl.getUniformLocation(prog, 'uFx'), 1)
        gl.uniform2f(gl.getUniformLocation(prog, 'uRes'), width, height)
        const uTime = gl.getUniformLocation(prog, 'uTime')
        gl.viewport(0, 0, width, height)

        const start = performance.now()
        let first = true
        const frame = () => {
          if (!document.hidden) {
            gl.uniform1f(uTime, (performance.now() - start) / 1000)
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
            if (first) {
              first = false
              onReady?.()
            }
          }
          raf = requestAnimationFrame(frame)
        }
        frame()
      })
      .catch(() => onReady?.())

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
    }
  }, [imgSrc, fxSrc, width, height, onReady])

  return <canvas ref={ref} width={width} height={height} className="scene-canvas" />
}
