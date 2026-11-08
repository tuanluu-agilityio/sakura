// Falling petals: everything derives from uTime + per-instance seeds (no CPU per-instance work).
uniform float uTime;
uniform vec2 uWindDir;      // ctx.wind.direction (x, z)
uniform float uWindStrength;
uniform float uGust;        // 0..1 gust envelope
uniform vec4 uInfluence;    // xyz centre + radius (w = 0 disables); pushes petals away
uniform vec3 uColorA;       // PALETTE.petal
uniform vec3 uColorB;       // PALETTE.blossomDeep

attribute vec4 aSeed;       // volume index, phase offset, flutter freq, size
attribute vec4 aBase;       // spawn x, spawn y, spawn z, ground y
attribute float aLateral;   // normalised distance from the spawn-volume axis

varying vec3 vColor;
varying float vShade;

#include <fog_pars_vertex>

// Mirror of petalFade() in fade.ts (keep in sync).
float petalFade(float t, float lateral) {
  return smoothstep(0.0, 0.08, t) * (1.0 - smoothstep(0.88, 1.0, t)) * (1.0 - smoothstep(0.85, 1.0, lateral));
}

mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }
mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }

void main() {
  float h1 = fract(aSeed.y * 91.7 + aSeed.x * 0.37);
  float h2 = fract(aSeed.y * 13.1);
  float life = 14.0 + 8.0 * h1;                 // 14-22 s per seed
  float t = fract(uTime / life + aSeed.y);      // lifecycle phase; wrap hidden by petalFade
  float age = t * life;

  vec3 p = vec3(aBase.x, mix(aBase.y, aBase.w, t), aBase.z);
  // Flutter sway +-0.5 m.
  p.x += sin(t * aSeed.z) * 0.5;
  p.z += cos(t * aSeed.z * 0.7 + aSeed.y * 6.2832) * 0.5;
  // Wind drift and gust swirl.
  vec3 dir = vec3(uWindDir.x, 0.0, uWindDir.y);
  p += dir * uWindStrength * age * 0.6;
  p += uGust * cross(vec3(0.0, 1.0, 0.0), dir) * sin(t * 6.0) * 1.5;
  // External influence (e.g. player walking through): radial push, fades out at the radius.
  if (uInfluence.w > 0.0) {
    vec3 d = p - uInfluence.xyz;
    float k = 1.0 - smoothstep(0.0, uInfluence.w, length(d));
    p += normalize(d + vec3(0.0, 0.001, 0.0)) * k * uInfluence.w * 0.5;
  }

  // Tumble about two axes; scale by size and the fade factor.
  float a = age * (1.5 + h2 * 2.0) + aSeed.y * 6.2832;
  float b = age * (1.0 + h1 * 1.5);
  vec3 local = rotY(b) * rotX(a) * position * (aSeed.w * petalFade(t, aLateral));

  vec4 mvPosition = modelViewMatrix * vec4(p + local, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  vColor = mix(uColorA, uColorB, fract(aSeed.y * 37.7));
  vShade = 0.82 + 0.18 * abs(cos(a));
  #include <fog_vertex>
}
