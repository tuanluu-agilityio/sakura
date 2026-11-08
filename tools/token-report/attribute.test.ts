import { expect, it } from 'vitest';
import { attribute } from './attribute.ts';

const map = { 7: 'M1-T7', 12: 'M0-T12' };

it('attributes by description issue number', () => {
  expect(attribute({ description: '[#12] review', branch: 'main' }, map)).toBe('M0-T12');
});
it('attributes by branch', () => {
  expect(attribute({ branch: 'feat/7-sky' }, map)).toBe('M1-T7');
  expect(attribute({ branch: 'chore/12-x' }, map)).toBe('M0-T12');
});
it('description wins over branch', () => {
  expect(attribute({ description: '[#12] x', branch: 'feat/7-sky' }, map)).toBe('M0-T12');
});
it('main and untagged descriptions are orchestration', () => {
  expect(attribute({ branch: 'main' }, map)).toBe('orchestration');
  expect(attribute({ description: '[plan] outline', branch: 'main' }, map)).toBe('orchestration');
});
it('unknown issue number', () => {
  expect(attribute({ description: '[#99] x', branch: 'main' }, map)).toBe('#99');
});
