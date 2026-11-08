varying vec3 vColor;
varying float vShade;

#include <fog_pars_fragment>

void main() {
  gl_FragColor = vec4(vColor * vShade, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}
