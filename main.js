// ============================================================================
// main.js — Entry point: bootstraps the game, wires up UI elements.
// ============================================================================

import { Game } from './game.js';
import { toggleMute, isMuted } from './audio.js';

// TODO: Add touch/mobile controls for mobile devices

function init() {
    const canvas = document.getElementById('game-canvas');
    const scoreEl = document.getElementById('score-value');
    const livesEl = document.getElementById('lives-value');
    const muteBtn = document.getElementById('mute-btn');

    // Score/lives update callback
    const onScoreUpdate = (score, lives) => {
        scoreEl.textContent = score;
        livesEl.textContent = '\u2764 '.repeat(lives).trim();
    };

    // Create and start the game
    const game = new Game(canvas, onScoreUpdate);
    game.run();

    // Mute toggle button
    muteBtn.addEventListener('click', () => {
        const muted = toggleMute();
        muteBtn.textContent = muted ? '\uD83D\uDD07 Sound Off' : '\uD83D\uDD0A Sound On';
    });
}

// Wait for DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
