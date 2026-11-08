import { describe, expect, it } from 'vitest';
import { LAYOUT } from '../../core/layout';
import { surfaceAt } from './surface';

describe('surfaceAt', () => {
  it('path is dirt', () => expect(surfaceAt(0, 50)).toBe('dirt'));
  it('stream is water', () => {
    const p = LAYOUT.stream.points[1]!; // (-40, 8) is a stream vertex
    expect(surfaceAt(p.x, p.z)).toBe('water');
  });
  it('bridge centre is wood', () => expect(surfaceAt(LAYOUT.bridge.x, LAYOUT.bridge.z)).toBe('wood'));
  it('lanterns are stone', () => {
    for (const l of LAYOUT.lanterns) expect(surfaceAt(l.x, l.z)).toBe('stone');
    expect(surfaceAt(LAYOUT.lanterns[0]!.x + 0.7, LAYOUT.lanterns[0]!.z)).toBe('stone');
  });
  it('open field is grass', () => expect(surfaceAt(-50, 50)).toBe('grass'));
  it('crossing is dirt', () => expect(surfaceAt(10, -40)).toBe('dirt'));
});
