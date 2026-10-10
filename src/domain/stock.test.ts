import { describe, expect, it } from 'vitest';
import { stockAlert } from './stock';

describe('individual percentage stock alerts', () => {
  it.each([
    [24, 24, 'ok'], [23, 24, 'ok'], [5, 24, 'ok'], [4, 24, 'low'],
    [3, 24, 'low'], [2, 24, 'critical'], [0, 24, 'critical'], [-1, 24, 'critical'],
    [5, 25, 'low'], [6, 25, 'ok'], [3, 30, 'critical'], [4, 30, 'low'],
    [6, 30, 'low'], [7, 30, 'ok'], [1, 4, 'ok'], [0, 4, 'critical'],
    [1, 5, 'low'], [1, 10, 'critical'], [2, 10, 'low'], [3, 10, 'ok'],
  ] as const)('stock %s, objective %s => %s', (current, objective, level) => {
    expect(stockAlert(current, objective)).toEqual({ level, needsReplenishment: level !== 'ok' });
  });
  it.each([null, 0, -1, NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1])('invalid objective %s never alerts, even with negative stock', objective => {
    for (const current of [-5, 0, 1]) expect(stockAlert(current, objective)).toEqual({ level: 'ok', needsReplenishment: false });
  });
  it('uses each product objective, without a global quantity threshold', () => {
    expect(stockAlert(4, 24).level).toBe('low');
    expect(stockAlert(4, 12).level).toBe('ok');
    expect(stockAlert(4, 40).level).toBe('critical');
  });
  it('does not alert for invalid current quantities or overflow at large valid objectives', () => {
    for (const current of [NaN, Infinity, 0.5]) expect(stockAlert(current, 24).needsReplenishment).toBe(false);
    const objective = Number.MAX_SAFE_INTEGER;
    const low = Math.floor(objective / 5), critical = Math.floor(objective / 10);
    expect(stockAlert(low, objective).level).toBe('low');
    expect(stockAlert(low + 1, objective).level).toBe('ok');
    expect(stockAlert(critical, objective).level).toBe('critical');
    expect(stockAlert(critical + 1, objective).level).toBe('low');
  });
});
