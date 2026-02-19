// ============================================================================
// leaderboard.js — Top score persistence and ranking.
// ============================================================================

const LEADERBOARD_KEY = 'pacman.leaderboard.v1';
export const LEADERBOARD_LIMIT = 10;

function getStorage(storage) {
    if (storage) return storage;
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
    return null;
}

export function normalizeInitials(value) {
    return String(value || '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 3);
}

export function sanitizeEntries(entries) {
    if (!Array.isArray(entries)) return [];

    return entries
        .map((entry) => ({
            initials: normalizeInitials(entry?.initials),
            score: Number(entry?.score) || 0,
        }))
        .filter((entry) => entry.initials.length === 3 && entry.score >= 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, LEADERBOARD_LIMIT);
}

export function loadLeaderboard(storage) {
    const targetStorage = getStorage(storage);
    if (!targetStorage) return [];

    try {
        const raw = targetStorage.getItem(LEADERBOARD_KEY);
        if (!raw) return [];
        return sanitizeEntries(JSON.parse(raw));
    } catch (_) {
        return [];
    }
}

export function saveLeaderboard(entries, storage) {
    const targetStorage = getStorage(storage);
    const sanitized = sanitizeEntries(entries);
    if (!targetStorage) return sanitized;

    targetStorage.setItem(LEADERBOARD_KEY, JSON.stringify(sanitized));
    return sanitized;
}

export function isHighScore(score, entries) {
    const safeScore = Number(score) || 0;
    const safeEntries = sanitizeEntries(entries);
    if (safeEntries.length < LEADERBOARD_LIMIT) return safeScore > 0;
    return safeScore > safeEntries[safeEntries.length - 1].score;
}

export function addHighScore(entries, initials, score) {
    const normalized = normalizeInitials(initials);
    if (normalized.length !== 3) return sanitizeEntries(entries);

    const safeEntries = sanitizeEntries(entries);
    safeEntries.push({
        initials: normalized,
        score: Number(score) || 0,
    });
    return sanitizeEntries(safeEntries);
}
