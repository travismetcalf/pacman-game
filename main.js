// ============================================================================
// main.js — Entry point: bootstraps game, leaderboard, and UI controls.
// ============================================================================

import { Game } from './game.js';
import { toggleMute } from './audio.js';
import {
    addHighScore,
    isHighScore,
    loadLeaderboard,
    normalizeInitials,
    saveLeaderboard,
} from './leaderboard.js';

function formatLeaderboardEntry(entry) {
    return `${entry.initials} .... ${entry.score}`;
}

function renderLeaderboard(entries, listEl) {
    listEl.innerHTML = '';
    if (entries.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No high scores yet';
        listEl.appendChild(li);
        return;
    }

    entries.forEach((entry) => {
        const li = document.createElement('li');
        li.textContent = formatLeaderboardEntry(entry);
        listEl.appendChild(li);
    });
}

function init() {
    const canvas = document.getElementById('game-canvas');
    const scoreEl = document.getElementById('score-value');
    const livesEl = document.getElementById('lives-value');
    const levelEl = document.getElementById('level-value');
    const muteBtn = document.getElementById('mute-btn');
    const leaderboardListEl = document.getElementById('leaderboard-list');
    const highScoreModalEl = document.getElementById('highscore-modal');
    const highScoreFormEl = document.getElementById('highscore-form');
    const initialsInputEl = document.getElementById('initials-input');

    let leaderboard = loadLeaderboard();
    let pendingHighScore = null;

    const showHighScorePrompt = (score) => {
        pendingHighScore = score;
        highScoreModalEl.classList.remove('hidden');
        initialsInputEl.value = '';
        initialsInputEl.focus();
    };

    const hideHighScorePrompt = () => {
        pendingHighScore = null;
        highScoreModalEl.classList.add('hidden');
    };

    const onHudUpdate = (score, lives, level, maxLevel) => {
        scoreEl.textContent = score;
        livesEl.textContent = '\u2764 '.repeat(lives).trim();
        levelEl.textContent = `${level}/${maxLevel}`;
    };

    const onGameEnd = (score) => {
        if (isHighScore(score, leaderboard)) {
            showHighScorePrompt(score);
        }
    };

    const game = new Game(canvas, { onHudUpdate, onGameEnd });
    game.run();
    onHudUpdate(0, 3, 1, 4);
    renderLeaderboard(leaderboard, leaderboardListEl);

    initialsInputEl.addEventListener('input', () => {
        initialsInputEl.value = normalizeInitials(initialsInputEl.value);
    });

    initialsInputEl.addEventListener('keydown', (e) => {
        e.stopPropagation();
    });

    document.addEventListener('keydown', (e) => {
        if (highScoreModalEl.classList.contains('hidden')) return;
        if (e.target === initialsInputEl) return;
        e.preventDefault();
        e.stopPropagation();
    }, true);

    highScoreFormEl.addEventListener('submit', (e) => {
        e.preventDefault();
        const initials = normalizeInitials(initialsInputEl.value);
        if (initials.length !== 3 || pendingHighScore === null) return;

        leaderboard = addHighScore(leaderboard, initials, pendingHighScore);
        leaderboard = saveLeaderboard(leaderboard);
        renderLeaderboard(leaderboard, leaderboardListEl);
        hideHighScorePrompt();
    });

    muteBtn.addEventListener('click', () => {
        const muted = toggleMute();
        muteBtn.textContent = muted ? '\uD83D\uDD07 Sound Off' : '\uD83D\uDD0A Sound On';
    });

    window.addEventListener('keydown', (e) => {
        const activeTag = document.activeElement && document.activeElement.tagName;
        if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

        if (e.key === 'm' || e.key === 'M') {
            const muted = toggleMute();
            muteBtn.textContent = muted ? '\uD83D\uDD07 Sound Off' : '\uD83D\uDD0A Sound On';
        }
    });

    // QA hooks used only by automated test suite.
    window.__PACMAN_DEBUG__ = {
        start: () => game.startGame(),
        setScore: (score) => game.setScoreForTests(score),
        forceGameOver: () => game.forceGameOverForTests(),
        advanceLevel: () => game.advanceLevelForTests(),
        setLeaderboard: (entries) => {
            leaderboard = saveLeaderboard(entries);
            renderLeaderboard(leaderboard, leaderboardListEl);
        },
        clearLeaderboard: () => {
            leaderboard = saveLeaderboard([]);
            renderLeaderboard(leaderboard, leaderboardListEl);
        },
        getLeaderboard: () => loadLeaderboard(),
    };
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
