// ============================================================================
// game.js — Central game orchestration: game loop, state management,
//           collision detection, mode cycling, scoring, and rendering.
//
// Rendering approach: Canvas API
// Why Canvas: Provides smooth, pixel-level control for animation (mouth,
// ghost wobble, etc.) and performs well for real-time game loops. A DOM/grid
// approach would require frequent style updates which is less efficient for
// continuous animation at 60fps.
// ============================================================================

import { CELL_SIZE, COLORS, STARTING_LIVES, EXTRA_LIFE_SCORE,
         SCORE_DOT, SCORE_POWER_PELLET, SCORE_GHOST_BASE,
         FRIGHTENED_DURATION_MS, CHASE_DURATION_MS, SCATTER_DURATION_MS,
         GHOST_EXIT_DELAYS } from './config.js';
import { Maze, TILE } from './maze.js';
import { PacMan } from './pacman.js';
import { Ghost, GHOST_MODE } from './ghost.js';
import { input } from './input.js';
import * as audio from './audio.js';

// TODO: Support multiple levels with different maze layouts

const STATE = {
    START:     'START',
    PLAYING:   'PLAYING',
    DYING:     'DYING',
    GAME_OVER: 'GAME_OVER',
    WIN:       'WIN',
};

export class Game {
    constructor(canvas, onScoreUpdate) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onScoreUpdate = onScoreUpdate;

        this.maze = new Maze();
        this.canvas.width = this.maze.cols * CELL_SIZE;
        this.canvas.height = this.maze.rows * CELL_SIZE;

        this.pacman = new PacMan(this.maze);
        this.ghosts = [];
        for (let i = 0; i < 4; i++) {
            this.ghosts.push(new Ghost(i, this.maze));
        }

        this.state = STATE.START;
        this.score = 0;
        this.lives = STARTING_LIVES;
        this.extraLifeAwarded = false;

        this.globalGhostMode = GHOST_MODE.SCATTER;
        this.modeTimer = 0;
        this.modePhase = 0;

        this.ghostsEatenThisFright = 0;
        this.dyingTimer = 0;
        this._lastTime = 0;
        this._animFrameId = null;

        input.onAnyKey = () => {
            if (this.state === STATE.START || this.state === STATE.GAME_OVER || this.state === STATE.WIN) {
                this.startGame();
            }
        };
    }

    startGame() {
        this.maze.reset();
        this.score = 0;
        this.lives = STARTING_LIVES;
        this.extraLifeAwarded = false;
        this.state = STATE.PLAYING;
        this._resetPositions();
        this.onScoreUpdate(this.score, this.lives);
        audio.playGameStartSound();
    }

    _resetPositions() {
        this.pacman.reset();
        this.ghosts.forEach((g, i) => {
            g.reset();
            g.scheduleExit(GHOST_EXIT_DELAYS[i]);
        });
        this.globalGhostMode = GHOST_MODE.SCATTER;
        this.modeTimer = 0;
        this.modePhase = 0;
        this.ghostsEatenThisFright = 0;
    }

    run() {
        this._lastTime = performance.now();
        const loop = (timestamp) => {
            const dt = Math.min((timestamp - this._lastTime) / 1000, 0.05);
            this._lastTime = timestamp;
            this._update(dt);
            this._draw();
            this._animFrameId = requestAnimationFrame(loop);
        };
        this._animFrameId = requestAnimationFrame(loop);
    }

    stop() {
        if (this._animFrameId) {
            cancelAnimationFrame(this._animFrameId);
            this._animFrameId = null;
        }
    }

    _update(dt) {
        if (this.state !== STATE.PLAYING && this.state !== STATE.DYING) return;

        if (this.state === STATE.DYING) {
            this.dyingTimer -= dt;
            if (this.dyingTimer <= 0) {
                if (this.lives <= 0) {
                    this.state = STATE.GAME_OVER;
                    audio.playGameOverSound();
                } else {
                    this._resetPositions();
                    this.state = STATE.PLAYING;
                }
            }
            return;
        }

        this._updateGhostMode(dt);

        const dir = input.peekDirection();
        if (dir) {
            this.pacman.setDirection(dir);
        }

        const { ateItem } = this.pacman.update(dt);
        if (ateItem !== null) {
            this._handleItemEaten(ateItem);
        }

        const pacPos = this.pacman.getPosition();
        for (const ghost of this.ghosts) {
            ghost.update(dt, pacPos, this.globalGhostMode);
        }

        this._checkGhostCollisions();

        if (this.maze.getRemainingDots() === 0) {
            this.state = STATE.WIN;
        }
    }

    _updateGhostMode(dt) {
        if (this.ghosts.some(g => g.frightened)) return;

        this.modeTimer += dt * 1000;
        const isScatter = this.modePhase % 2 === 0;
        const duration = isScatter ? SCATTER_DURATION_MS : CHASE_DURATION_MS;

        if (this.modeTimer >= duration) {
            this.modeTimer = 0;
            this.modePhase++;
            this.globalGhostMode = (this.modePhase % 2 === 0)
                ? GHOST_MODE.SCATTER
                : GHOST_MODE.CHASE;

            for (const ghost of this.ghosts) {
                ghost.setGlobalMode(this.globalGhostMode);
            }
        }
    }

    _handleItemEaten(tileType) {
        if (tileType === TILE.DOT) {
            this.score += SCORE_DOT;
            audio.playDotSound();
        } else if (tileType === TILE.POWER_PELLET) {
            this.score += SCORE_POWER_PELLET;
            audio.playPowerPelletSound();
            this.ghostsEatenThisFright = 0;

            for (const ghost of this.ghosts) {
                ghost.setFrightened(FRIGHTENED_DURATION_MS);
            }
        }

        if (!this.extraLifeAwarded && this.score >= EXTRA_LIFE_SCORE) {
            this.lives++;
            this.extraLifeAwarded = true;
        }

        this.onScoreUpdate(this.score, this.lives);
    }

    _checkGhostCollisions() {
        const pac = this.pacman.getPosition();

        for (const ghost of this.ghosts) {
            if (ghost.mode === GHOST_MODE.IN_HOUSE || ghost.mode === GHOST_MODE.EATEN) continue;

            const gPos = ghost.getPosition();
            const dx = pac.x - gPos.x;
            const dy = pac.y - gPos.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < 0.5) {
                if (ghost.mode === GHOST_MODE.FRIGHTENED) {
                    ghost.eat();
                    this.ghostsEatenThisFright++;
                    const bonus = SCORE_GHOST_BASE * Math.pow(2, this.ghostsEatenThisFright - 1);
                    this.score += bonus;
                    audio.playGhostEatenSound();
                    this.onScoreUpdate(this.score, this.lives);
                } else {
                    this.lives--;
                    this.onScoreUpdate(this.score, this.lives);
                    audio.playLifeLostSound();
                    this.state = STATE.DYING;
                    this.dyingTimer = 1.2;
                    return;
                }
            }
        }
    }

    _draw() {
        const { ctx, canvas } = this;

        ctx.fillStyle = COLORS.BACKGROUND;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        this.maze.draw(ctx);

        if (this.state !== STATE.DYING || Math.floor(Date.now() / 200) % 2 === 0) {
            this.pacman.draw(ctx);
        }

        for (const ghost of this.ghosts) {
            ghost.draw(ctx);
        }

        if (this.state === STATE.START) {
            this._drawOverlay('PAC-MAN', 'Press any key to start', '#ffff00');
        } else if (this.state === STATE.GAME_OVER) {
            this._drawOverlay('GAME OVER', 'Press any key to restart', '#ff0000');
        } else if (this.state === STATE.WIN) {
            this._drawOverlay('YOU WIN!', 'Press any key to play again', '#00ff00');
        }
    }

    _drawOverlay(title, subtitle, titleColor) {
        const { ctx, canvas } = this;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = titleColor;
        ctx.font = 'bold 32px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 20);

        ctx.fillStyle = COLORS.TEXT;
        ctx.font = '14px "Press Start 2P", monospace';
        ctx.fillText(subtitle, canvas.width / 2, canvas.height / 2 + 25);

        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText('Arrow keys or WASD to move', canvas.width / 2, canvas.height / 2 + 55);
    }
}
