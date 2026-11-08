import { describe, it, expect } from 'vitest';
import { createInput } from './input';

function setup() {
  const target = new EventTarget();
  const input = createInput(target as unknown as HTMLElement);
  const fire = (type: string, props: Record<string, unknown> = {}, on: EventTarget = target): void => {
    const e = new Event(type, { cancelable: true });
    Object.assign(e, props);
    on.dispatchEvent(e);
  };
  return { input, fire, target };
}

describe('createInput', () => {
  it('normalises diagonal W+D to length 1', () => {
    const { input, fire } = setup();
    fire('keydown', { code: 'KeyW' });
    fire('keydown', { code: 'KeyD' });
    expect(input.move.length()).toBeCloseTo(1);
    expect(input.move.x).toBeGreaterThan(0);
    expect(input.move.y).toBeGreaterThan(0);
  });

  it('Shift sets run; releasing keys stops movement', () => {
    const { input, fire } = setup();
    fire('keydown', { code: 'ShiftLeft' });
    fire('keydown', { code: 'ArrowUp' });
    expect(input.run).toBe(true);
    expect(input.move.y).toBe(1);
    fire('keyup', { code: 'ArrowUp' });
    fire('keyup', { code: 'ShiftLeft' });
    expect(input.move.length()).toBe(0);
    expect(input.run).toBe(false);
  });

  it('consumeAction returns true once after P, then false', () => {
    const { input, fire } = setup();
    fire('keydown', { code: 'KeyP' });
    expect(input.consumeAction('photo')).toBe(true);
    expect(input.consumeAction('photo')).toBe(false);
    fire('keydown', { code: 'Escape' });
    fire('keydown', { code: 'KeyM' });
    expect(input.consumeAction('menu')).toBe(true);
    expect(input.consumeAction('mute')).toBe(true);
  });

  it('accumulates drag look and wheel zoom, endFrame resets them', () => {
    const { input, fire } = setup();
    fire('mousemove', { movementX: 5, movementY: 5 }); // not dragging
    expect(input.look.length()).toBe(0);
    fire('mousedown', { button: 0 });
    fire('mousemove', { movementX: 3, movementY: -2 });
    fire('wheel', { deltaY: 100 });
    expect(input.look.x).toBe(3);
    expect(input.look.y).toBe(-2);
    expect(input.zoom).toBe(100);
    input.endFrame();
    expect(input.look.length()).toBe(0);
    expect(input.zoom).toBe(0);
    fire('mouseup');
    fire('mousemove', { movementX: 9, movementY: 9 });
    expect(input.look.length()).toBe(0);
  });

  it('touch sink merges into the same state, last writer wins', () => {
    const { input, fire } = setup();
    fire('keydown', { code: 'KeyW' });
    input.touch.move(1, 0, true);
    expect(input.move.x).toBe(1);
    expect(input.move.y).toBe(0);
    expect(input.run).toBe(true);
    fire('keydown', { code: 'KeyD' });
    expect(input.move.length()).toBeCloseTo(1);
    expect(input.move.y).toBeGreaterThan(0);
    input.touch.look(4, 5);
    input.touch.zoom(2);
    input.touch.action('menu');
    expect(input.look.x).toBe(4);
    expect(input.zoom).toBe(2);
    expect(input.consumeAction('menu')).toBe(true);
  });
});
