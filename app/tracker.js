// tracker.js — checklist state: which trophies the player has earned.
// State is a Set of earned trophy NAMES (names are the stable key), persisted
// to localStorage. This module owns storage, export and import; it knows
// nothing about the DOM except the download helper.

export const CHECKLIST_STORAGE_KEY = 'gta6-trophy-checklist';
export const EXPORT_FILENAME = 'gta6-trophy-progress.json';

/** Load the earned set from localStorage. Returns an empty Set when nothing
 *  is stored or the stored value is not a JSON array of strings. */
export function loadChecklist() {
  let raw = null;
  try {
    raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
  } catch {
    return new Set();
  }
  if (!raw) return new Set();
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return new Set();
  }
  if (!Array.isArray(parsed)) return new Set();
  return new Set(parsed.filter((name) => typeof name === 'string' && name.length > 0));
}

/** Persist the earned set to localStorage. */
export function saveChecklist(earnedSet) {
  try {
    localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify([...earnedSet]));
  } catch {
    // Storage may be unavailable (private mode, quota). The in-memory set
    // still works for this session; the user can export a backup.
  }
}

/** Mark a trophy earned (true) or not earned (false), then persist. */
export function setEarned(earnedSet, trophyName, earned) {
  if (earned) earnedSet.add(trophyName);
  else earnedSet.delete(trophyName);
  saveChecklist(earnedSet);
  return earnedSet;
}

/** True when the trophy with this name is in the earned set. */
export function isEarned(earnedSet, trophyName) {
  return earnedSet.has(trophyName);
}

/** Remove every earned mark and persist the empty set. */
export function clearChecklist(earnedSet) {
  earnedSet.clear();
  saveChecklist(earnedSet);
  return earnedSet;
}

/** Summary numbers for the header: how many earned, out of how many, and
 *  the percentage toward Platinum. */
export function progressSummary(earnedSet, totalTrophies) {
  const total = Math.max(totalTrophies, 0);
  const earned = earnedSet.size;
  const percent = total === 0 ? 0 : Math.round((earned / total) * 100);
  return { earned, total, percent };
}

/** Download the earned set as a JSON file (an array of trophy names). */
export function exportProgress(earnedSet) {
  const payload = JSON.stringify([...earnedSet].sort(), null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = EXPORT_FILENAME;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Validate imported progress and return the new earned Set.
 * `text` must parse to a JSON array whose every entry is a string naming a
 * trophy in `knownNames`. Throws an Error with a human-readable message
 * when the file is not valid progress data. Unknown names are rejected so a
 * file from another game cannot silently pollute the checklist.
 */
export function importProgress(text, knownNames) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  if (!Array.isArray(parsed)) {
    throw new Error('Progress files must contain a JSON array of trophy names.');
  }
  const known = new Set(knownNames);
  const unknown = parsed.filter((name) => typeof name !== 'string' || !known.has(name));
  if (unknown.length > 0) {
    const sample = unknown.slice(0, 3).map((name) => String(name)).join(', ');
    throw new Error(`Unknown trophy name(s) in file: ${sample}. Is this progress from this guide?`);
  }
  return new Set(parsed);
}
