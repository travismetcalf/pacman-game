// ============================================================================
// audio.js — Sound effects management using the Web Audio API
//
// Since we can't bundle .wav files easily, sounds are synthesized procedurally
// using OscillatorNode. Each sound function creates a short tone/effect.
// ============================================================================

// TODO: Add background music with a mute option separate from sound effects
// TODO: Replace synthesized sounds with real audio files for a polished feel
//       e.g., new Audio('assets/sounds/dot.wav')

let audioCtx = null;
let muted = false;

/** Lazily initialize AudioContext (must happen after user gesture in some browsers). */
function getCtx() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

/** Play a simple tone. */
function playTone(frequency, duration, type = 'square', volume = 0.15) {
    if (muted) return;
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
}

/** Play a frequency sweep (for power-up or special events). */
function playSweep(startFreq, endFreq, duration, type = 'sawtooth', volume = 0.12) {
    if (muted) return;
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(endFreq, ctx.currentTime + duration);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
}

// --- Public sound functions ---

/** Short blip when eating a regular dot. */
export function playDotSound() {
    playTone(600, 0.05, 'sine', 0.08);
}

/** Deeper, longer tone for power pellet. */
export function playPowerPelletSound() {
    playSweep(200, 800, 0.3, 'sawtooth', 0.15);
}

/** Ascending sweep when eating a ghost. */
export function playGhostEatenSound() {
    playSweep(300, 1200, 0.4, 'square', 0.12);
}

/** Descending tone when losing a life. */
export function playLifeLostSound() {
    playSweep(800, 100, 0.8, 'sawtooth', 0.2);
}

/** Short ascending jingle for game start. */
export function playGameStartSound() {
    const ctx = getCtx();
    if (muted) return;

    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
        setTimeout(() => playTone(freq, 0.15, 'square', 0.12), i * 120);
    });
}

/** Descending jingle for game over. */
export function playGameOverSound() {
    const ctx = getCtx();
    if (muted) return;

    const notes = [784, 659, 523, 392]; // G5, E5, C5, G4
    notes.forEach((freq, i) => {
        setTimeout(() => playTone(freq, 0.2, 'sawtooth', 0.12), i * 200);
    });
}

// --- Mute control ---

export function toggleMute() {
    muted = !muted;
    return muted;
}

export function isMuted() {
    return muted;
}

export function setMuted(value) {
    muted = value;
}
