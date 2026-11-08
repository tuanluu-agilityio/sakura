import * as THREE from 'three';

const COUNT = 14;
const DRIFT = 1.2;
const WRAP = 900;

const VERT = /* glsl */ `
uniform float uOffset;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 c = instanceMatrix[3].xyz;
  c.x = mod(c.x + uOffset + ${WRAP}.0, ${2 * WRAP}.0) - ${WRAP}.0;
  vec4 mv = viewMatrix * vec4(c, 1.0);
  mv.xy += position.xy * vec2(instanceMatrix[0][0], instanceMatrix[1][1]);
  gl_Position = projectionMatrix * mv;
}`;
const FRAG = /* glsl */ `
uniform sampler2D uMap;
uniform float uOpacity;
varying vec2 vUv;
void main() {
  gl_FragColor = vec4(1.0, 1.0, 1.0, texture2D(uMap, vUv).a * uOpacity);
}`;

function radialTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.6)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

export interface Clouds { mesh: THREE.InstancedMesh; update(elapsed: number): void; dispose(): void }

export function createClouds(): Clouds {
  const geometry = new THREE.PlaneGeometry(1, 1);
  const map = radialTexture();
  const material = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: map }, uOpacity: { value: 0.85 }, uOffset: { value: 0 } },
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    fog: false,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, COUNT);
  mesh.renderOrder = -9;
  mesh.frustumCulled = false;
  const m = new THREE.Matrix4();
  for (let i = 0; i < COUNT; i++) {
    // Deterministic scatter: golden-angle spread over the sky, heights 160-260 m.
    const a = i * 2.399963;
    const r = 150 + ((i * 37) % 14) * 50;
    const w = 150 + ((i * 53) % 7) * 25;
    m.makeScale(w, w * 0.45, 1);
    m.setPosition(Math.cos(a) * r, 160 + ((i * 29) % 11) * 10, Math.sin(a) * r);
    mesh.setMatrixAt(i, m);
  }
  mesh.instanceMatrix.needsUpdate = true;
  return {
    mesh,
    update(elapsed) { material.uniforms.uOffset!.value = elapsed * DRIFT; },
    dispose() { geometry.dispose(); material.dispose(); map.dispose(); mesh.dispose(); },
  };
}
