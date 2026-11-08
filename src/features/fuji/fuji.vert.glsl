uniform float uHeight;
varying vec3 vNormal;
varying float vH;
varying vec3 vObj;

void main() {
  vNormal = normalize(mat3(modelMatrix) * normal);
  vH = position.y / uHeight;
  vObj = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
