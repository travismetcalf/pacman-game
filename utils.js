// ============================================================================
// utils.js — Helper functions used across modules
// ============================================================================

/**
 * Returns the Manhattan distance between two grid positions.
 * Used for ghost AI target-distance calculations.
 */
export function manhattanDistance(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

/**
 * Returns the squared Euclidean distance (avoids sqrt for perf).
 */
export function squaredDistance(x1, y1, x2, y2) {
    return (x1 - x2) ** 2 + (y1 - y2) ** 2;
}

/**
 * Direction vectors indexed by direction name.
 * These correspond to movement deltas on the grid (col, row).
 */
export const DIRECTIONS = {
    UP:    { dx:  0, dy: -1 },
    DOWN:  { dx:  0, dy:  1 },
    LEFT:  { dx: -1, dy:  0 },
    RIGHT: { dx:  1, dy:  0 },
};

/** All four direction keys for iteration */
export const DIRECTION_KEYS = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

/**
 * Returns the opposite direction name.
 */
export function oppositeDirection(dir) {
    switch (dir) {
        case 'UP':    return 'DOWN';
        case 'DOWN':  return 'UP';
        case 'LEFT':  return 'RIGHT';
        case 'RIGHT': return 'LEFT';
        default:      return null;
    }
}

/**
 * Shuffle an array in place (Fisher-Yates).
 */
export function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Clamp a value between min and max.
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
