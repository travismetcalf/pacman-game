// ============================================================================
// difficulty.js — Per-level tuning for game progression.
// ============================================================================

import {
    CHASE_DURATION_MS,
    SCATTER_DURATION_MS,
    FRIGHTENED_DURATION_MS,
    GHOST_EXIT_DELAYS,
} from './config.js';

const LEVEL_MIN = 1;
const LEVEL_MAX = 4;

function clampLevel(level) {
    return Math.max(LEVEL_MIN, Math.min(LEVEL_MAX, Number(level) || LEVEL_MIN));
}

export function getLevelSettings(level) {
    const safeLevel = clampLevel(level);
    const levelOffset = safeLevel - 1;

    return {
        level: safeLevel,
        ghostDtMultiplier: 1 + levelOffset * 0.18,
        frightenedDurationMs: Math.max(2200, FRIGHTENED_DURATION_MS - levelOffset * 900),
        scatterDurationMs: Math.max(2500, SCATTER_DURATION_MS - levelOffset * 1000),
        chaseDurationMs: Math.max(9000, CHASE_DURATION_MS - levelOffset * 2000),
        ghostExitDelays: GHOST_EXIT_DELAYS.map((delay) => Math.max(0, delay - levelOffset * 500)),
    };
}
