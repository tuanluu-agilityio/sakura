uniform float uTime;
uniform vec3 uSkyTop;
uniform vec3 uSkyHorizon;
uniform vec3 uColor;
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
  // Faint ripple: perturb the up normal with two slow noise lobes.
  vec2 p = vWorld.xz * 1.3;
  float rx = vnoise(p + vec2(uTime * 0.12, 0.0)) - 0.5;
  float rz = vnoise(p * 1.7 + vec2(0.0, -uTime * 0.1)) - 0.5;
  vec3 n = normalize(vec3(rx * 0.12, 1.0, rz * 0.12));

  vec3 v = normalize(cameraPosition - vWorld);
  float fres = pow(1.0 - max(dot(v, n), 0.0), 3.0);
  vec3 r = reflect(-v, n);
  vec3 sky = mix(uSkyHorizon, uSkyTop, smoothstep(0.0, 0.6, r.y));

  vec3 col = mix(uColor, sky, clamp(0.25 + fres * 0.9, 0.0, 1.0));
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}
