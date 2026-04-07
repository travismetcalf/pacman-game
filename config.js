// ============================================================================
// config.js — Tunable game constants
// Edit these values to adjust difficulty, scoring, and behavior.
// ============================================================================

// --- Grid & Rendering ---
/** Size in pixels of each maze cell */
export const CELL_SIZE = 24;

// --- Pac-Man ---
/** Pac-Man movement speed (cells per second) */
export const PACMAN_SPEED = 5.5;

/** Starting number of lives */
export const STARTING_LIVES = 3;

/** Number of playable levels (Level 1 + 3 harder levels) */
export const MAX_LEVEL = 4;

// --- Ghost Speeds ---
/** Normal ghost speed (cells per second) */
export const GHOST_BASE_SPEED = 4.0;

/** Ghost speed while frightened (cells per second) */
export const GHOST_FRIGHTENED_SPEED = 2.0;

/** Ghost speed when returning to the ghost house after being eaten */
export const GHOST_EATEN_SPEED = 8.0;

// TODO: Add separate speed configs per ghost for more nuanced difficulty

// --- Mode Durations (milliseconds) ---
/** How long ghosts stay in chase mode before switching to scatter */
export const CHASE_DURATION_MS = 20000;

/** How long ghosts scatter/roam before switching back to chase */
export const SCATTER_DURATION_MS = 7000;

/** How long frightened mode lasts after eating a power pellet */
export const FRIGHTENED_DURATION_MS = 6000;

/** Warning flash period at end of frightened mode (ms before it ends) */
export const FRIGHTENED_WARNING_MS = 2000;

// --- Ghost House ---
/** Delay (ms) before each ghost exits the ghost house at level start */
export const GHOST_EXIT_DELAYS = [0, 2000, 5000, 8000];

// --- Scoring ---
/** Points for eating a regular dot */
export const SCORE_DOT = 10;

/** Points for eating a power pellet */
export const SCORE_POWER_PELLET = 50;

/**
 * Points for eating ghosts during a single frightened period.
 * Each successive ghost eaten doubles the points: 200, 400, 800, 1600
 */
export const SCORE_GHOST_BASE = 200;

/** Extra life awarded at this score threshold */
export const EXTRA_LIFE_SCORE = 10000;

// --- Visual ---
/** Colors used for rendering */
export const COLORS = {
    WALL: '#1a1aff',
    WALL_BORDER: '#3333ff',
    DOT: '#ffcc00',
    POWER_PELLET: '#ffcc00',
    PACMAN: '#ffff00',
    GHOST_FRIGHTENED: '#2020dd',
    GHOST_FRIGHTENED_WARNING: '#ffffff',
    GHOST_EATEN: '#aaaaaa',
    BACKGROUND: '#000000',
    TEXT: '#ffffff',
    GHOST_COLORS: ['#ff0000', '#ffb8ff', '#00ffff', '#ffb852'], // Blinky, Pinky, Inky, Clyde
};

/** Pac-Man mouth animation speed (radians per second) */
export const MOUTH_SPEED = 12;

/** Maximum mouth opening angle in radians */
export const MOUTH_MAX_ANGLE = 0.35;
