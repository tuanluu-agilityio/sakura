// Shared by the stream ribbon and the paddy water cells.
varying vec2 vUv;
varying vec3 vWorld;

#include <fog_pars_vertex>

void main() {
  vUv = uv;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vec4 mvPosition = viewMatrix * world;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
