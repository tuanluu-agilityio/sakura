uniform vec3 uTop;
uniform vec3 uHorizon;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
varying vec3 vDir;
void main() {
  vec3 dir = normalize(vDir);
  vec3 col = mix(uHorizon, uTop, smoothstep(0.0, 0.55, dir.y));
  float glow = pow(max(dot(dir, uSunDir), 0.0), 24.0);
  col += uSunColor * glow * 0.25;
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
