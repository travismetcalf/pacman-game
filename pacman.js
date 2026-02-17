// ============================================================================
// pacman.js — Pac-Man entity: movement, animation, collision with maze
// ============================================================================

import { CELL_SIZE, PACMAN_SPEED, COLORS, MOUTH_SPEED, MOUTH_MAX_ANGLE } from './config.js';
import { DIRECTIONS } from './utils.js';

export class PacMan {
    constructor(maze) {
        this.maze = maze;
        this.reset();
    }

    /** Reset Pac-Man to starting position and state. */
    reset() {
        // Starting position (grid coords) — center-bottom area of the maze
        this.col = 14;
        this.row = 23;
        // Pixel-precise position (float)
        this.x = this.col;
        this.y = this.row;
        this.direction = 'LEFT';
        this.nextDirection = 'LEFT';
        this.moving = false;
        this.mouthAngle = 0;
        this.mouthOpening = true;
    }

    /** Queue a direction change. It will take effect when the turn is possible. */
    setDirection(dir) {
        this.nextDirection = dir;
    }

    /**
     * Update Pac-Man's position for this frame.
     * @param {number} dt — delta time in seconds
     * @returns {{ ateItem: number|null }} — the tile type eaten this frame, or null
     */
    update(dt) {
        // Animate mouth
        this._animateMouth(dt);

        const speed = PACMAN_SPEED * dt;

        // Try to turn in the queued direction
        if (this.nextDirection !== this.direction) {
            if (this._canMove(this.nextDirection)) {
                this.direction = this.nextDirection;
            }
        }

        // Move in current direction if possible
        if (this._canMove(this.direction)) {
            this.moving = true;
            const delta = DIRECTIONS[this.direction];
            this.x += delta.dx * speed;
            this.y += delta.dy * speed;

            // Tunnel wrapping
            this.x = this._wrapX(this.x);
        } else {
            this.moving = false;
            // Snap to grid to prevent floating-point drift when stopped
            this.x = Math.round(this.x);
            this.y = Math.round(this.y);
        }

        // Snap to center of lane on the perpendicular axis for smooth cornering
        this._snapToLane(dt);

        // Update grid cell
        this.col = Math.round(this.x);
        this.row = Math.round(this.y);

        // Wrap col
        this.col = this.maze.wrapCol(this.col);

        // Check if we're on a dot or power pellet
        const eaten = this.maze.eatDot(this.col, this.row);
        return { ateItem: eaten };
    }

    /** Check if Pac-Man can move in the given direction from current position. */
    _canMove(dir) {
        const delta = DIRECTIONS[dir];
        // Check the tile ahead — we need to check from the nearest grid cell
        const nextCol = this.maze.wrapCol(Math.round(this.x) + delta.dx);
        const nextRow = Math.round(this.y) + delta.dy;
        return !this.maze.isWallForPacman(nextCol, nextRow);
    }

    /** Smoothly snap to the center of the perpendicular lane axis. */
    _snapToLane(dt) {
        const snapSpeed = 15 * dt; // fast snap
        if (this.direction === 'LEFT' || this.direction === 'RIGHT') {
            // Snap Y toward nearest integer
            const targetY = Math.round(this.y);
            this.y += (targetY - this.y) * Math.min(snapSpeed, 1);
        } else {
            // Snap X toward nearest integer
            const targetX = Math.round(this.x);
            this.x += (targetX - this.x) * Math.min(snapSpeed, 1);
        }
    }

    /** Handle horizontal tunnel wrapping. */
    _wrapX(x) {
        if (x < -0.5) return this.maze.cols - 0.5;
        if (x >= this.maze.cols) return -0.5;
        return x;
    }

    _animateMouth(dt) {
        if (this.moving) {
            if (this.mouthOpening) {
                this.mouthAngle += MOUTH_SPEED * dt;
                if (this.mouthAngle >= MOUTH_MAX_ANGLE) {
                    this.mouthAngle = MOUTH_MAX_ANGLE;
                    this.mouthOpening = false;
                }
            } else {
                this.mouthAngle -= MOUTH_SPEED * dt;
                if (this.mouthAngle <= 0) {
                    this.mouthAngle = 0;
                    this.mouthOpening = true;
                }
            }
        }
    }

    /** Draw Pac-Man on the canvas. */
    draw(ctx) {
        const px = this.x * CELL_SIZE + CELL_SIZE / 2;
        const py = this.y * CELL_SIZE + CELL_SIZE / 2;
        const radius = CELL_SIZE / 2 - 2;

        // Determine facing angle
        let baseAngle = 0;
        switch (this.direction) {
            case 'RIGHT': baseAngle = 0; break;
            case 'DOWN':  baseAngle = Math.PI / 2; break;
            case 'LEFT':  baseAngle = Math.PI; break;
            case 'UP':    baseAngle = -Math.PI / 2; break;
        }

        const mouth = this.mouthAngle * Math.PI; // scale to radians

        ctx.fillStyle = COLORS.PACMAN;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.arc(px, py, radius, baseAngle + mouth, baseAngle + Math.PI * 2 - mouth);
        ctx.closePath();
        ctx.fill();
    }

    /** Get bounding box center for collision. */
    getPosition() {
        return { x: this.x, y: this.y };
    }
}
