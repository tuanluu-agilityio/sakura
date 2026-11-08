import { WebGLRenderer, Scene, PerspectiveCamera, Color } from 'three';
import './style.css';

declare global {
  interface Window { __sakura?: { ready: boolean } }
}

const renderer = new WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(new Color('#fde2ef'));
document.body.appendChild(renderer.domElement);

const scene = new Scene();
const camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

function render(): void {
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  render();
});

render();
window.__sakura = { ready: true };
