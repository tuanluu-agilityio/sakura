import { describe, it, expect } from 'vitest';
import { createBus } from './bus';

describe('createBus', () => {
  it('on returns an unsubscribe function', () => {
    const bus = createBus();
    const got: boolean[] = [];
    const off = bus.on('crossing:state', (p) => got.push(p.closed));
    bus.emit('crossing:state', { closed: true });
    off();
    bus.emit('crossing:state', { closed: false });
    expect(got).toEqual([true]);
  });

  it('preserves emit order across listeners', () => {
    const bus = createBus();
    const order: string[] = [];
    bus.on('ui:visibility', () => order.push('a'));
    bus.on('ui:visibility', () => order.push('b'));
    bus.on('ui:visibility', () => order.push('c'));
    bus.emit('ui:visibility', { visible: true });
    expect(order).toEqual(['a', 'b', 'c']);
  });

  it('is safe to unsubscribe during emit', () => {
    const bus = createBus();
    const order: string[] = [];
    const offA = bus.on('photo:request', () => { order.push('a'); offA(); offB(); });
    const offB = bus.on('photo:request', () => order.push('b'));
    bus.on('photo:request', () => order.push('c'));
    bus.emit('photo:request', {});
    bus.emit('photo:request', {});
    expect(order).toEqual(['a', 'b', 'c', 'c']);
  });
});
