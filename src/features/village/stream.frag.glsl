uniform float uTime;
uniform vec3 uColor;
uniform vec3 uFoam;
varying vec2 vUv;
varying vec3 vWorld;

#include <fog_pars_fragment>

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

void main() {
  float flow = uTime * 0.25;
  float n1 = vnoise(vec2(vUv.x * 5.0, (vUv.y - flow) * 4.0));
  float n2 = vnoise(vec2(vUv.x * 9.0 + 3.7, (vUv.y - flow * 1.6) * 7.0));
  float streak = n1 * 0.6 + n2 * 0.4;
  vec3 col = uColor * (0.88 + 0.22 * smoothstep(0.35, 0.75, streak));
  col = mix(col, uFoam, 0.25 * smoothstep(0.7, 0.9, n2)); // sparkle flecks

  float edge = min(vUv.x, 1.0 - vUv.x);
  float foam = (1.0 - smoothstep(0.04, 0.12, edge)) * (0.55 + 0.45 * n1);
  col = mix(col, uFoam, clamp(foam, 0.0, 1.0));

  gl_FragColor = vec4(col, 0.85);
  #include <fog_fragment>
}
