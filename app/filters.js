// filters.js — filtering, text search and the spoiler toggle for the checklist.
// Pure logic plus the toggle's localStorage persistence; no rendering here.

export const SPOILER_STORAGE_KEY = 'gta6-trophy-spoilers-hidden';

export const KIND_LABELS = {
  story: 'Story',
  missable: 'Missable',
  collectibles: 'Collectibles',
  activities: 'Activities',
  online: 'Online',
};

export const GRADE_LABELS = {
  platinum: 'Platinum',
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
};

/** A fresh, unfiltered filter state. */
export function createFilters() {
  return {
    kind: 'all',
    grade: 'all',
    earned: 'all', // 'all' | 'earned' | 'not-earned'
    query: '',
  };
}

/** Spoiler preference: true means story spoilers are hidden (the default). */
export function loadSpoilerPreference() {
  try {
    const raw = localStorage.getItem(SPOILER_STORAGE_KEY);
    if (raw === null) return true;
    return raw === 'true';
  } catch {
    return true;
  }
}

/** Persist the spoiler preference. */
export function saveSpoilerPreference(hidden) {
  try {
    localStorage.setItem(SPOILER_STORAGE_KEY, hidden ? 'true' : 'false');
  } catch {
    // Storage unavailable; the in-memory value still applies this session.
  }
}

/**
 * True when this trophy's name/description must be concealed from the reader:
 * the spoiler toggle is ON, the trophy is a story trophy (kind "story") or
 * flagged hidden, and the player has not earned it yet. Earned trophies and
 * non-story trophies always show normally.
 */
export function isSpoilerConcealed(trophy, earnedSet, spoilersHidden) {
  if (!spoilersHidden) return false;
  if (earnedSet.has(trophy.name)) return false;
  return trophy.kind === 'story' || trophy.hidden === true;
}

/** Case-insensitive search over name, description and guide. Empty query matches all. */
export function matchesSearch(trophy, query) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [trophy.name, trophy.description, trophy.guide]
    .filter((part) => typeof part === 'string')
    .join(' ')
    .toLowerCase();
  return haystack.includes(needle);
}

/** True when the trophy passes the kind filter. The "missable" kind filter
 *  matches any trophy flagged missable, whatever its base kind is. */
export function matchesKind(trophy, kind) {
  if (kind === 'all') return true;
  if (kind === 'missable') return trophy.missable === true;
  return trophy.kind === kind;
}

/** True when the trophy passes the grade filter. */
export function matchesGrade(trophy, grade) {
  return grade === 'all' || trophy.grade === grade;
}

/** True when the trophy passes the earned-state filter. */
export function matchesEarnedState(trophy, earnedState, earnedSet) {
  if (earnedState === 'all') return true;
  const earned = earnedSet.has(trophy.name);
  return earnedState === 'earned' ? earned : !earned;
}

/** Apply every active filter and the search query; returns a new array in
 *  the data file's original order. */
export function applyFilters(trophies, filters, earnedSet) {
  return trophies.filter(
    (trophy) =>
      matchesKind(trophy, filters.kind) &&
      matchesGrade(trophy, filters.grade) &&
      matchesEarnedState(trophy, filters.earned, earnedSet) &&
      matchesSearch(trophy, filters.query),
  );
}
