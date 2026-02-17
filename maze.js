// ============================================================================
// maze.js — Maze layout, tile types, and rendering
//
// The maze is stored as a 2D array of integers. Each integer represents a
// tile type (wall, dot, power pellet, empty, ghost house, etc.).
// ============================================================================

import { CELL_SIZE, COLORS } from './config.js';

// --- Tile type constants ---
export const TILE = {
    EMPTY: 0,
    WALL: 1,
    DOT: 2,
    POWER_PELLET: 3,
    GHOST_HOUSE: 4,   // interior of ghost house — ghosts can pass, Pac-Man cannot
    GHOST_DOOR: 5,    // the gate ghosts exit through
};

// TODO: Support multiple levels with different maze layouts

/**
 * Classic-style 28×31 maze layout.
 * Legend:  1=wall  2=dot  3=power pellet  4=ghost house  5=ghost door  0=empty
 */
const MAZE_TEMPLATE = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
    [1,3,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,3,1],
    [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
    [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
    [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
    [0,0,0,0,0,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,0,0,0,0,0],
    [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0],
    [0,0,0,0,0,1,2,1,1,0,1,1,1,5,5,1,1,1,0,1,1,2,1,0,0,0,0,0],
    [1,1,1,1,1,1,2,1,1,0,1,4,4,4,4,4,4,1,0,1,1,2,1,1,1,1,1,1],
    [0,0,0,0,0,0,2,0,0,0,1,4,4,4,4,4,4,1,0,0,0,2,0,0,0,0,0,0],
    [1,1,1,1,1,1,2,1,1,0,1,4,4,4,4,4,4,1,0,1,1,2,1,1,1,1,1,1],
    [0,0,0,0,0,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,0,0,0,0,0],
    [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0],
    [0,0,0,0,0,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,0,0,0,0,0],
    [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
    [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
    [1,3,2,2,1,1,2,2,2,2,2,2,2,0,0,2,2,2,2,2,2,2,1,1,2,2,3,1],
    [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
    [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
    [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
    [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
    [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

export class Maze {
    constructor() {
        // Deep-copy the template so we can mutate it (eating dots)
        this.grid = MAZE_TEMPLATE.map(row => [...row]);
        this.rows = this.grid.length;
        this.cols = this.grid[0].length;
        this.totalDots = this._countDots();
    }

    /** Reset the maze to its original state (all dots restored). */
    reset() {
        this.grid = MAZE_TEMPLATE.map(row => [...row]);
        this.totalDots = this._countDots();
    }

    /** Count dots + power pellets remaining. */
    _countDots() {
        let count = 0;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c] === TILE.DOT || this.grid[r][c] === TILE.POWER_PELLET) {
                    count++;
                }
            }
        }
        return count;
    }

    /** Returns how many dots + power pellets are still uneaten. */
    getRemainingDots() {
        return this._countDots();
    }

    /** Returns the tile type at (col, row). Out-of-bounds returns WALL. */
    getTile(col, row) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
            return TILE.WALL;
        }
        return this.grid[row][col];
    }

    /** Returns true if the tile at (col, row) blocks movement for Pac-Man. */
    isWallForPacman(col, row) {
        const tile = this.getTile(col, row);
        return tile === TILE.WALL || tile === TILE.GHOST_HOUSE || tile === TILE.GHOST_DOOR;
    }

    /** Returns true if the tile at (col, row) blocks movement for ghosts. */
    isWallForGhost(col, row, canUseDoor = false) {
        const tile = this.getTile(col, row);
        if (tile === TILE.WALL) return true;
        if (tile === TILE.GHOST_DOOR && !canUseDoor) return true;
        return false;
    }

    /**
     * Eat the dot/pellet at (col, row). Returns the tile type that was eaten,
     * or null if there was nothing to eat.
     */
    eatDot(col, row) {
        const tile = this.grid[row][col];
        if (tile === TILE.DOT || tile === TILE.POWER_PELLET) {
            this.grid[row][col] = TILE.EMPTY;
            return tile;
        }
        return null;
    }

    /**
     * Handle tunnel wrapping. If an entity moves off one side, wrap to the other.
     * Returns the wrapped column value.
     */
    wrapCol(col) {
        if (col < 0) return this.cols - 1;
        if (col >= this.cols) return 0;
        return col;
    }

    // --- Rendering ---

    /** Draw the entire maze onto the canvas context. */
    draw(ctx) {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const tile = this.grid[r][c];
                const x = c * CELL_SIZE;
                const y = r * CELL_SIZE;

                switch (tile) {
                    case TILE.WALL:
                        this._drawWall(ctx, x, y, c, r);
                        break;
                    case TILE.DOT:
                        this._drawDot(ctx, x, y);
                        break;
                    case TILE.POWER_PELLET:
                        this._drawPowerPellet(ctx, x, y);
                        break;
                    case TILE.GHOST_DOOR:
                        this._drawGhostDoor(ctx, x, y);
                        break;
                    // EMPTY and GHOST_HOUSE are just black
                }
            }
        }
    }

    _drawWall(ctx, x, y, col, row) {
        ctx.fillStyle = COLORS.WALL;
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

        // Draw subtle border lines for a more classic look
        ctx.strokeStyle = COLORS.WALL_BORDER;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
    }

    _drawDot(ctx, x, y) {
        const cx = x + CELL_SIZE / 2;
        const cy = y + CELL_SIZE / 2;
        ctx.fillStyle = COLORS.DOT;
        ctx.beginPath();
        ctx.arc(cx, cy, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawPowerPellet(ctx, x, y) {
        const cx = x + CELL_SIZE / 2;
        const cy = y + CELL_SIZE / 2;
        // Pulsing effect — use time-based radius
        const pulse = Math.sin(Date.now() / 200) * 1.5 + 5;
        ctx.fillStyle = COLORS.POWER_PELLET;
        ctx.beginPath();
        ctx.arc(cx, cy, pulse, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawGhostDoor(ctx, x, y) {
        ctx.fillStyle = '#ffb8ff';
        ctx.fillRect(x, y + CELL_SIZE * 0.4, CELL_SIZE, CELL_SIZE * 0.2);
    }
}
