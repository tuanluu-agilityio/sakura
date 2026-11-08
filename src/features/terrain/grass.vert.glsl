uniform float uTime;
uniform vec2 uWindDir;
uniform float uWind; // 0.1 + strength * 0.5 + gust * 0.4
uniform float uBladeHeight;
varying vec3 vColor;
varying float vH;

void main() {
  vec4 wp = instanceMatrix * vec4(position, 1.0);
  float h = position.y / uBladeHeight;
  float bend = h * h;
  float sway = sin(uTime * 1.6 + wp.x * 0.3 + wp.z * 0.2) * bend * uWind;
  wp.xz += uWindDir * sway * uBladeHeight;
  vColor = instanceColor;
  vH = h;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * wp;
}
