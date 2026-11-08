varying vec3 vColor;
varying float vH;

void main() {
  gl_FragColor = vec4(vColor * mix(0.72, 1.05, vH), 1.0);
}
