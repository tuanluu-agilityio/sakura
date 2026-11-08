import { Vector2 } from 'three';
import type { Action, InputState } from './types';

const ACTION_KEYS: Record<string, Action> = { KeyP: 'photo', KeyM: 'mute', Escape: 'menu' };
const MOVE_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

export type Input = InputState & { endFrame(): void; dispose(): void };

/** Keyboard + mouse (+ touch sink) input. Key events and mouse-move/up listen on the target's document. */
export function createInput(target: HTMLElement): Input {
  const doc: EventTarget & { pointerLockElement?: Element | null } =
    (target as { ownerDocument?: Document }).ownerDocument ?? target;
  const keys = new Set<string>();
  const actions = new Set<Action>();
  let dragging = false;

  const state: Input = {
    move: new Vector2(),
    run: false,
    look: new Vector2(),
    zoom: 0,
    consumeAction(a) {
      return actions.delete(a);
    },
    touch: {
      // last-writer-wins with keyboard: touch overwrites move/run directly; next key event recomputes from keys.
      move(x, y, run) {
        state.move.set(x, y);
        if (state.move.lengthSq() > 1) state.move.normalize();
        state.run = run;
      },
      look(dx, dy) {
        state.look.x += dx;
        state.look.y += dy;
      },
      zoom(d) {
        state.zoom += d;
      },
      action(a) {
        actions.add(a);
      },
    },
    endFrame() {
      state.look.set(0, 0);
      state.zoom = 0;
    },
    dispose() {
      for (const [t, type, fn] of listeners) t.removeEventListener(type, fn as EventListener);
    },
  };

  const recompute = (): void => {
    const x = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
    const y = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0);
    state.move.set(x, y);
    if (x !== 0 && y !== 0) state.move.normalize();
    state.run = keys.has('ShiftLeft') || keys.has('ShiftRight');
  };

  const onKeyDown = (e: KeyboardEvent): void => {
    const a = ACTION_KEYS[e.code];
    if (a) {
      if (!e.repeat) actions.add(a);
      return;
    }
    if (MOVE_KEYS.has(e.code) || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      keys.add(e.code);
      recompute();
    }
  };
  const onKeyUp = (e: KeyboardEvent): void => {
    if (keys.delete(e.code)) recompute();
  };
  const onBlur = (): void => {
    keys.clear();
    dragging = false;
    recompute();
  };
  const onMouseDown = (e: MouseEvent): void => {
    if (e.button === 0) dragging = true;
  };
  const onMouseUp = (): void => {
    dragging = false;
  };
  const onMouseMove = (e: MouseEvent): void => {
    if (dragging || doc.pointerLockElement === target) {
      state.look.x += e.movementX;
      state.look.y += e.movementY;
    }
  };
  const onWheel = (e: WheelEvent): void => {
    state.zoom += e.deltaY;
    e.preventDefault?.();
  };

  const listeners: [EventTarget, string, unknown][] = [
    [doc, 'keydown', onKeyDown],
    [doc, 'keyup', onKeyUp],
    [doc, 'mouseup', onMouseUp],
    [doc, 'mousemove', onMouseMove],
    [target, 'mousedown', onMouseDown],
    [target, 'wheel', onWheel],
  ];
  if (typeof window !== 'undefined') listeners.push([window, 'blur', onBlur]);
  for (const [t, type, fn] of listeners) t.addEventListener(type, fn as EventListener, type === 'wheel' ? { passive: false } : undefined);

  return state;
}
