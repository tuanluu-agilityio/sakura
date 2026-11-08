import { TextureLoader, SRGBColorSpace, type Texture } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import type { AssetLoader, GLTF } from './types';

/** Loads models, textures and audio; progress counts every request started so far. */
export function createAssets(): AssetLoader {
  const gltfLoader = new GLTFLoader();
  gltfLoader.setMeshoptDecoder(MeshoptDecoder);
  const textureLoader = new TextureLoader();
  let audioCtx: AudioContext | null = null;

  const listeners: ((loaded: number, total: number) => void)[] = [];
  let loaded = 0;
  let total = 0;
  const report = (): void => { for (const fn of listeners) fn(loaded, total); };

  function track<T>(p: Promise<T>): Promise<T> {
    total++;
    report();
    // Failed requests still count as settled so progress can reach 100 %.
    return p.finally(() => { loaded++; report(); });
  }

  return {
    gltf: (url) => track(gltfLoader.loadAsync(url) as Promise<GLTF>),
    texture: (url) => track(textureLoader.loadAsync(url).then((t: Texture) => {
      t.colorSpace = SRGBColorSpace;
      return t;
    })),
    audio: (url) => track(
      fetch(url)
        .then((r) => {
          if (!r.ok) throw new Error(`audio ${url}: HTTP ${r.status}`);
          return r.arrayBuffer();
        })
        .then((buf) => {
          audioCtx ??= new AudioContext();
          return audioCtx.decodeAudioData(buf);
        }),
    ),
    onProgress(fn) {
      listeners.push(fn);
    },
  };
}
