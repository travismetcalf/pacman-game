// ============================================================================
// ghost.js — Ghost entity: AI behavior, movement, frightened/eaten states
//
// Ghost AI overview:
//   - CHASE mode: each ghost targets Pac-Man (simplified — all chase directly).
//   - SCATTER mode: each ghost targets its home corner.
//   - FRIGHTENED mode: ghosts move randomly and can be eaten.
//   - EATEN mode: ghost returns to ghost house, then re-enters the maze.
//
// TODO: Implement more advanced ghost personalities (e.g., one that ambushes,
//       one that patrols, one that is random). Classic Pac-Man gives each
//       ghost a unique targeting strategy.
// ============================================================================

import {
    CELL_SIZE, COLORS,
    GHOST_BASE_SPEED, GHOST_FRIGHTENED_SPEED, GHOST_EATEN_SPEED,
} from './config.js';
import { DIRECTIONS, DIRECTION_KEYS, oppositeDirection, squaredDistance, shuffleArray } from './utils.js';
import { TILE } from './maze.js';

/** Ghost behavioral modes */
export const GHOST_MODE = {
    CHASE: 'CHASE',
    SCATTER: 'SCATTER',
    FRIGHTENED: 'FRIGHTENED',
    EATEN: 'EATEN',
    IN_HOUSE: 'IN_HOUSE',
};

/** Scatter-mode target corners for each ghost index */
const SCATTER_TARGETS = [
    { col: 25, row: 0 },   // Blinky — top-right
    { col: 2,  row: 0 },   // Pinky  — top-left
    { col: 27, row: 30 },  // Inky   — bottom-right
    { col: 0,  row: 30 },  // Clyde  — bottom-left
];

/** Ghost house center position */
const HOUSE_CENTER = { col: 14, row: 14 };
const HOUSE_EXIT = { col: 14, row: 11 };

export class Ghost {
    /**
     * @param {number} index — ghost index (0–3), determines color & scatter target
     * @param {object} maze — the Maze instance
     */
    constructor(index, maze) {
        this.index = index;
        this.maze = maze;
        this.color = COLORS.GHOST_COLORS[index];
        this.scatterTarget = SCATTER_TARGETS[index];
        this.reset();
    }

    reset() {
        // Start inside the ghost house
        this.col = 12 + this.index * 2;
        this.row = 14;
        this.x = this.col;
        this.y = this.row;
        this.direction = 'UP';
        this.mode = GHOST_MODE.IN_HOUSE;
        this.exitTimer = 0;
        this.frightened = false;
        this.frightenedTimer = 0;
        this.eaten = false;
    }

    /**
     * Trigger exit from ghost house after a delay.
     * @param {number} delay — milliseconds before exiting
     */
    scheduleExit(delay) {
        this.exitTimer = delay;
        this.mode = GHOST_MODE.IN_HOUSE;
    }

    /** Enter frightened mode. */
    setFrightened(durationMs) {
        if (this.mode === GHOST_MODE.EATEN) return; // don't frighten eaten ghosts
        this.frightened = true;
        this.frightenedTimer = durationMs;
        if (this.mode !== GHOST_MODE.IN_HOUSE) {
            this.mode = GHOST_MODE.FRIGHTENED;
            // Reverse direction on entering frightened mode
            this.direction = oppositeDirection(this.direction) || this.direction;
        }
    }

    /** Set the global mode (CHASE or SCATTER). Only applies if not frightened/eaten. */
    setGlobalMode(mode) {
        if (this.mode === GHOST_MODE.FRIGHTENED || this.mode === GHOST_MODE.EATEN || this.mode === GHOST_MODE.IN_HOUSE) {
            return;
        }
        if (this.mode !== mode) {
            this.direction = oppositeDirection(this.direction) || this.direction;
        }
        this.mode = mode;
    }

    /** Mark ghost as eaten — it will return to the house. */
    eat() {
        this.mode = GHOST_MODE.EATEN;
        this.frightened = false;
        this.eaten = true;
    }

    /**
     * Update ghost for one frame.
     * @param {number} dt — seconds
     * @param {object} pacmanPos — { x, y } of Pac-Man in grid coords
     * @param {string} globalMode — current global ghost mode (CHASE or SCATTER)
     */
    update(dt, pacmanPos, globalMode) {
        // --- Handle in-house state ---
        if (this.mode === GHOST_MODE.IN_HOUSE) {
            this.exitTimer -= dt * 1000;
            if (this.exitTimer <= 0) {
                // Move to exit position
                this.x = HOUSE_EXIT.col;
                this.y = HOUSE_EXIT.row;
                this.col = HOUSE_EXIT.col;
                this.row = HOUSE_EXIT.row;
                this.direction = 'LEFT';
                this.mode = this.frightened ? GHOST_MODE.FRIGHTENED : globalMode;
            } else {
                // Bob up and down inside the house
                this.y = this.row + Math.sin(Date.now() / 300 + this.index) * 0.3;
                return;
            }
        }

        // --- Frightened timer ---
        if (this.frightened) {
            this.frightenedTimer -= dt * 1000;
            if (this.frightenedTimer <= 0) {
                this.frightened = false;
                if (this.mode === GHOST_MODE.FRIGHTENED) {
                    this.mode = globalMode;
                }
            }
        }

        // --- Choose speed ---
        let speed;
        switch (this.mode) {
            case GHOST_MODE.EATEN:
                speed = GHOST_EATEN_SPEED;
                break;
            case GHOST_MODE.FRIGHTENED:
                speed = GHOST_FRIGHTENED_SPEED;
                break;
            default:
                speed = GHOST_BASE_SPEED;
        }

        // --- Move ---
        const delta = DIRECTIONS[this.direction];
        this.x += delta.dx * speed * dt;
        this.y += delta.dy * speed * dt;

        // Tunnel wrapping
        if (this.x < -0.5) this.x = this.maze.cols - 0.5;
        if (this.x >= this.maze.cols) this.x = -0.5;

        // Snap to perpendicular lane
        if (this.direction === 'LEFT' || this.direction === 'RIGHT') {
            const targetY = Math.round(this.y);
            this.y += (targetY - this.y) * Math.min(15 * dt, 1);
        } else {
            const targetX = Math.round(this.x);
            this.x += (targetX - this.x) * Math.min(15 * dt, 1);
        }

        // --- Decision at intersections ---
        const prevCol = this.col;
        const prevRow = this.row;
        this.col = Math.round(this.x);
        this.row = Math.round(this.y);
        this.col = this.maze.wrapCol(this.col);

        // Only pick a new direction when we enter a new cell
        if (this.col !== prevCol || this.row !== prevRow) {
            this._chooseDirection(pacmanPos);

            // If eaten and reached house, respawn
            if (this.mode === GHOST_MODE.EATEN) {
                if (this.col === HOUSE_EXIT.col && this.row === HOUSE_EXIT.row) {
                    this.x = HOUSE_CENTER.col;
                    this.y = HOUSE_CENTER.row;
                    this.col = HOUSE_CENTER.col;
                    this.row = HOUSE_CENTER.row;
                    this.mode = GHOST_MODE.IN_HOUSE;
                    this.eaten = false;
                    this.exitTimer = 1000; // brief pause before re-emerging
                }
            }
        }
    }

    /**
     * At each intersection, choose the best direction.
     * Ghosts never reverse voluntarily (except when mode changes).
     */
    _chooseDirection(pacmanPos) {
        const canUseDoor = this.mode === GHOST_MODE.EATEN || this.mode === GHOST_MODE.IN_HOUSE;
        const reverse = oppositeDirection(this.direction);

        // Gather possible directions (exclude reverse and walls)
        const possible = DIRECTION_KEYS.filter(dir => {
            if (dir === reverse) return false;
            const d = DIRECTIONS[dir];
            const nc = this.maze.wrapCol(this.col + d.dx);
            const nr = this.row + d.dy;
            return !this.maze.isWallForGhost(nc, nr, canUseDoor);
        });

        if (possible.length === 0) {
            // Dead end — must reverse
            this.direction = reverse;
            return;
        }

        if (this.mode === GHOST_MODE.FRIGHTENED) {
            // Random direction when frightened
            this.direction = possible[Math.floor(Math.random() * possible.length)];
            return;
        }

        // Target-based pathfinding
        let target;
        switch (this.mode) {
            case GHOST_MODE.CHASE:
                target = { col: Math.round(pacmanPos.x), row: Math.round(pacmanPos.y) };
                break;
            case GHOST_MODE.SCATTER:
                target = this.scatterTarget;
                break;
            case GHOST_MODE.EATEN:
                target = HOUSE_EXIT;
                break;
            default:
                target = this.scatterTarget;
        }

        // Pick the direction that minimizes distance to target
        let bestDir = possible[0];
        let bestDist = Infinity;
        for (const dir of possible) {
            const d = DIRECTIONS[dir];
            const nc = this.maze.wrapCol(this.col + d.dx);
            const nr = this.row + d.dy;
            const dist = squaredDistance(nc, nr, target.col, target.row);
            if (dist < bestDist) {
                bestDist = dist;
                bestDir = dir;
            }
        }
        this.direction = bestDir;
    }

    /** Draw the ghost on the canvas. */
    draw(ctx) {
        const px = this.x * CELL_SIZE + CELL_SIZE / 2;
        const py = this.y * CELL_SIZE + CELL_SIZE / 2;
        const r = CELL_SIZE / 2 - 1;

        // Choose color based on mode
        let color;
        if (this.mode === GHOST_MODE.EATEN) {
            color = COLORS.GHOST_EATEN;
        } else if (this.mode === GHOST_MODE.FRIGHTENED) {
            // Flash white near the end of frightened mode
            color = (this.frightenedTimer < 2000 && Math.floor(Date.now() / 200) % 2 === 0)
                ? COLORS.GHOST_FRIGHTENED_WARNING
                : COLORS.GHOST_FRIGHTENED;
        } else {
            color = this.color;
        }

        // Ghost body — rounded top, wavy bottom
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(px, py - r * 0.15, r, Math.PI, 0, false);
        // Wavy bottom
        const bottom = py + r;
        const waveH = r * 0.25;
        ctx.lineTo(px + r, bottom);
        const segments = 3;
        const segW = (2 * r) / segments;
        for (let i = 0; i < segments; i++) {
            const sx = px + r - (i + 0.5) * segW;
            const sy = bottom - waveH;
            const ex = px + r - (i + 1) * segW;
            ctx.quadraticCurveTo(sx, sy, ex, bottom);
        }
        ctx.closePath();
        ctx.fill();

        // Eyes (skip body details when eaten — just show eyes)
        if (this.mode !== GHOST_MODE.FRIGHTENED) {
            this._drawEyes(ctx, px, py, r);
        } else {
            // Frightened face — simple expression
            this._drawFrightenedFace(ctx, px, py, r);
        }
    }

    _drawEyes(ctx, px, py, r) {
        const eyeR = r * 0.25;
        const pupilR = r * 0.12;
        const eyeOffsetX = r * 0.35;
        const eyeOffsetY = -r * 0.2;

        // Direction-based pupil offset
        let pdx = 0, pdy = 0;
        switch (this.direction) {
            case 'LEFT':  pdx = -pupilR; break;
            case 'RIGHT': pdx = pupilR; break;
            case 'UP':    pdy = -pupilR; break;
            case 'DOWN':  pdy = pupilR; break;
        }

        for (const side of [-1, 1]) {
            // White of eye
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(px + side * eyeOffsetX, py + eyeOffsetY, eyeR, 0, Math.PI * 2);
            ctx.fill();

            // Pupil
            ctx.fillStyle = '#000088';
            ctx.beginPath();
            ctx.arc(px + side * eyeOffsetX + pdx, py + eyeOffsetY + pdy, pupilR, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    _drawFrightenedFace(ctx, px, py, r) {
        // Simple dots for eyes
        ctx.fillStyle = '#ffffff';
        for (const side of [-1, 1]) {
            ctx.beginPath();
            ctx.arc(px + side * r * 0.3, py - r * 0.2, r * 0.1, 0, Math.PI * 2);
            ctx.fill();
        }
        // Wavy mouth
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const mouthY = py + r * 0.2;
        ctx.moveTo(px - r * 0.4, mouthY);
        for (let i = 0; i < 4; i++) {
            const mx = px - r * 0.4 + (i + 0.5) * (r * 0.8 / 4);
            const my = mouthY + (i % 2 === 0 ? -2 : 2);
            ctx.lineTo(mx, my);
        }
        ctx.lineTo(px + r * 0.4, mouthY);
        ctx.stroke();
    }

    getPosition() {
        return { x: this.x, y: this.y };
    }
}
