// ============================================================================
// input.js — Keyboard input handling
//
// Captures arrow keys and WASD, exposes the latest direction to the game.
// Also handles "any key to start" and restart keys.
// ============================================================================

// TODO: Add touch/mobile controls for mobile devices (swipe gestures or on-screen d-pad)

const KEY_MAP = {
    ArrowUp:    'UP',
    ArrowDown:  'DOWN',
    ArrowLeft:  'LEFT',
    ArrowRight: 'RIGHT',
    w: 'UP',    W: 'UP',
    s: 'DOWN',  S: 'DOWN',
    a: 'LEFT',  A: 'LEFT',
    d: 'RIGHT', D: 'RIGHT',
};

class InputManager {
    constructor() {
        /** The last direction key pressed (null until first press). */
        this.lastDirection = null;

        /** Callback fired on any keydown (used for "press any key to start"). */
        this.onAnyKey = null;

        this._onKeyDown = this._onKeyDown.bind(this);
        window.addEventListener('keydown', this._onKeyDown);
    }

    _onKeyDown(e) {
        const targetTag = e.target && e.target.tagName;
        const isTypingTarget = targetTag === 'INPUT' || targetTag === 'TEXTAREA' || (e.target && e.target.isContentEditable);

        // Map to a direction if applicable
        const dir = KEY_MAP[e.key];
        if (dir) {
            e.preventDefault();
            this.lastDirection = dir;
        }

        // Fire the "any key" callback regardless of which key
        if (this.onAnyKey && !isTypingTarget) {
            this.onAnyKey(e.key);
        }
    }

    /** Consume and return the last direction, then clear it. */
    consumeDirection() {
        const dir = this.lastDirection;
        this.lastDirection = null;
        return dir;
    }

    /** Peek at the last direction without consuming it. */
    peekDirection() {
        return this.lastDirection;
    }

    /** Clean up event listeners. */
    destroy() {
        window.removeEventListener('keydown', this._onKeyDown);
    }
}

// Singleton — one input manager for the whole app
export const input = new InputManager();
