// Sakura blossom card sway. Injected after <common>; replaces the instancing step of <project_vertex>.
uniform float uTime;
uniform float uGust;      // ctx.wind.gust, 0..1
uniform vec2 uWindDir;    // ctx.wind.direction (x, z)
uniform float uTreeHeight;
varying float vShade;

// Returns the instanced, wind-displaced position in tree-local space.
vec4 sakuraSway(vec3 p) {
  vec4 local = vec4(p, 1.0);
  vec3 anchor = vec3(0.0);
#ifdef USE_INSTANCING
  local = instanceMatrix * local;
  anchor = instanceMatrix[3].xyz;
#endif
  float heightFactor = clamp(anchor.y / uTreeHeight, 0.0, 1.0);
  vec3 dir = vec3(uWindDir.x, 0.0, uWindDir.y);
  local.xyz += dir * (sin(uTime * 0.9 + anchor.x * 0.5) * 0.06 + uGust * 0.12) * heightFactor;
  // Fake top-down light: lower clusters a touch darker, independent of scene lights.
  vShade = 0.8 + 0.2 * smoothstep(0.45, 1.0, heightFactor);
  return local;
}
