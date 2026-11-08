// Frozen core contract. Changes after M0 = separate PR labelled `contract`, merged first.
import type * as THREE from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';

export type { GLTF };

export type QualityLevel = 'low' | 'medium' | 'high';
export interface QualityProfile { level: QualityLevel; petals: number; shadowMapSize: number; bloom: boolean; maxPixelRatio: number; viewDistance: number; grassDensity: number; }
export type Surface = 'grass' | 'dirt' | 'wood' | 'stone' | 'water';
export type GameMode = 'loading' | 'intro' | 'play' | 'photo' | 'menu';
export interface EventMap {
  'game:mode': { mode: GameMode; prev: GameMode };
  'quality:change': { profile: QualityProfile };
  'train:approach': { direction: 1 | -1; eta: number };      // seconds until train front reaches crossing
  'train:pass': { direction: 1 | -1 };                         // front at crossing
  'train:clear': { direction: 1 | -1 };                        // tail left crossing zone
  'crossing:state': { closed: boolean };
  'wind:gust': { strength: number; direction: { x: number; z: number }; duration: number };
  'photo:request': {}; 'photo:done': { blob: Blob };
  'player:step': { surface: Surface; running: boolean };
  'ui:visibility': { visible: boolean };
  'settings:change': { settings: Settings };
}
export interface EventBus { on<K extends keyof EventMap>(t: K, fn: (p: EventMap[K]) => void): () => void; emit<K extends keyof EventMap>(t: K, p: EventMap[K]): void; }
export type Collider =
  | { kind: 'circle'; x: number; z: number; r: number }
  | { kind: 'box'; x: number; z: number; hw: number; hd: number; rot: number };   // half extents, rot radians around Y
export interface ColliderRegistry { add(c: Collider): string; remove(id: string): void; setEnabled(id: string, on: boolean): void; resolve(pos: THREE.Vector3, radius: number, prev?: THREE.Vector3): THREE.Vector3; }  // mutates+returns pos; prev enables anti-tunnelling sub-steps
export interface Terrain { heightAt(x: number, z: number): number; surfaceAt(x: number, z: number): Surface; }
export type Action = 'photo' | 'mute' | 'menu';
export interface TouchSink { move(x: number, y: number, run: boolean): void; look(dx: number, dy: number): void; zoom(d: number): void; action(a: Action): void; }
export interface InputState { move: THREE.Vector2; run: boolean; look: THREE.Vector2; zoom: number; consumeAction(a: Action): boolean; touch: TouchSink; }   // touch: M3-T3 feeds it
  // move: x=right y=forward, length ≤ 1. look: pixels since last frame (reset each frame). zoom: wheel/pinch delta since last frame.
export interface AssetLoader { gltf(url: string): Promise<GLTF>; texture(url: string): Promise<THREE.Texture>; audio(url: string): Promise<AudioBuffer>; onProgress(fn: (loaded: number, total: number) => void): void; }
export interface Settings { musicVolume: number; ambientVolume: number; muted: boolean; quality: 'auto' | QualityLevel; lang: 'vi' | 'en'; }
export interface SettingsStore { get(): Settings; set(patch: Partial<Settings>): void; }   // persists to localStorage 'sakura.settings', emits settings:change
export interface WindState { direction: THREE.Vector2; strength: number; gust: number; }  // gust 0..1 current gust envelope
export interface WorldContext {
  scene: THREE.Scene; camera: THREE.PerspectiveCamera; renderer: THREE.WebGLRenderer;
  bus: EventBus; terrain: Terrain; colliders: ColliderRegistry; input: InputState;
  assets: AssetLoader; settings: SettingsStore; quality: QualityProfile; wind: WindState;
  player: { position: THREE.Vector3; heading: number; speed: number };   // written only by player feature
  mode: GameMode; setMode(m: GameMode): void;
  provideTerrain(t: Terrain): void;      // terrain feature calls once; default is flat (height 0, 'grass')
  time: { elapsed: number };
}
export interface Feature { name: string; init(ctx: WorldContext): void | Promise<void>; update?(dt: number, elapsed: number): void; setQuality?(p: QualityProfile): void; dispose?(): void; }
