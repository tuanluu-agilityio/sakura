uniform vec3 uFuji;
uniform vec3 uSnow;
uniform vec3 uHorizon;
uniform vec3 uShadow;
uniform vec3 uSunDir;
uniform float uHaze;
uniform float fogExempt; // 1 = ignores scene.fog (aerial perspective is baked below)
varying vec3 vNormal;
varying float vH;
varying vec3 vObj;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
// Value noise periodic in x (period px lattice cells) so the angular seam at +-pi vanishes.
float vnoise(vec2 p, float px) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float x0 = mod(i.x, px), x1 = mod(i.x + 1.0, px);
  return mix(mix(hash(vec2(x0, i.y)), hash(vec2(x1, i.y)), f.x), mix(hash(vec2(x0, i.y + 1.0)), hash(vec2(x1, i.y + 1.0)), f.x), f.y);
}

void main() {
  float ang = atan(vObj.z, vObj.x);
  float noise = vnoise(vec2(ang * 2.8648, vH * 14.0), 18.0) * 2.0 - 1.0;
  vec3 col = mix(uFuji, uSnow, smoothstep(0.62, 0.72, vH + noise * 0.06));
  float lit = dot(normalize(vNormal), normalize(uSunDir)) * 0.5 + 0.5;
  col = mix(uShadow, col, mix(0.55, 1.0, smoothstep(0.25, 0.75, lit)));
  col = mix(col, uHorizon, 1.0 - smoothstep(0.0, 0.28, vH)); // base haze band
  col = mix(col, uHorizon, uHaze * fogExempt);                // baked aerial perspective
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
