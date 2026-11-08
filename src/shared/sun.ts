import { Vector3 } from 'three';

/** Single source of truth for the world sun direction (unit vector towards the sun). Treat as read-only. */
export const SUN_DIR: Readonly<Vector3> = new Vector3(-0.5, 0.45, -0.3).normalize();
