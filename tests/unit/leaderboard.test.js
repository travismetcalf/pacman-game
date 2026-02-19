import { describe, expect, it } from 'vitest';
import {
  LEADERBOARD_LIMIT,
  addHighScore,
  isHighScore,
  loadLeaderboard,
  normalizeInitials,
  saveLeaderboard,
  sanitizeEntries,
} from '../../leaderboard.js';

describe('leaderboard utilities', () => {
  it('normalizes initials into 3 uppercase characters', () => {
    expect(normalizeInitials('ab!1')).toBe('AB1');
    expect(normalizeInitials('longname')).toBe('LON');
  });

  it('sanitizes and sorts scores descending', () => {
    const entries = sanitizeEntries([
      { initials: 'bbb', score: 100 },
      { initials: 'AA', score: 999 },
      { initials: 'ccc', score: 500 },
    ]);

    expect(entries).toEqual([
      { initials: 'CCC', score: 500 },
      { initials: 'BBB', score: 100 },
    ]);
  });

  it('detects whether a score qualifies for top 10', () => {
    const full = Array.from({ length: LEADERBOARD_LIMIT }, (_, i) => ({
      initials: `A${i}A`.slice(0, 3),
      score: 1000 - i * 10,
    }));

    expect(isHighScore(2000, full)).toBe(true);
    expect(isHighScore(10, full)).toBe(false);
    expect(isHighScore(1, [])).toBe(true);
  });

  it('adds a high score and trims to leaderboard limit', () => {
    const full = Array.from({ length: LEADERBOARD_LIMIT }, (_, i) => ({
      initials: `B${i}B`.slice(0, 3),
      score: 1000 - i * 10,
    }));
    const next = addHighScore(full, 'xyz', 1500);

    expect(next[0]).toEqual({ initials: 'XYZ', score: 1500 });
    expect(next).toHaveLength(LEADERBOARD_LIMIT);
  });

  it('loads and saves entries from storage', () => {
    const memory = new Map();
    const mockStorage = {
      getItem: (k) => memory.get(k) ?? null,
      setItem: (k, v) => memory.set(k, v),
    };

    const saved = saveLeaderboard(
      [{ initials: 'abc', score: 321 }],
      mockStorage
    );
    const loaded = loadLeaderboard(mockStorage);

    expect(saved).toEqual([{ initials: 'ABC', score: 321 }]);
    expect(loaded).toEqual(saved);
  });
});
