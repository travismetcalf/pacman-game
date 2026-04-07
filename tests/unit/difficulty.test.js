import { describe, expect, it } from 'vitest';
import { getLevelSettings } from '../../difficulty.js';

describe('getLevelSettings', () => {
  it('returns base difficulty at level 1', () => {
    const settings = getLevelSettings(1);
    expect(settings.level).toBe(1);
    expect(settings.ghostDtMultiplier).toBe(1);
    expect(settings.frightenedDurationMs).toBeGreaterThan(0);
  });

  it('increases ghost pressure by higher levels', () => {
    const level2 = getLevelSettings(2);
    const level4 = getLevelSettings(4);

    expect(level4.ghostDtMultiplier).toBeGreaterThan(level2.ghostDtMultiplier);
    expect(level4.frightenedDurationMs).toBeLessThan(level2.frightenedDurationMs);
    expect(level4.scatterDurationMs).toBeLessThan(level2.scatterDurationMs);
    expect(level4.chaseDurationMs).toBeLessThan(level2.chaseDurationMs);
  });

  it('clamps unsupported levels into valid range', () => {
    expect(getLevelSettings(-1).level).toBe(1);
    expect(getLevelSettings(999).level).toBe(4);
  });
});
