/**
 * Daily HTML fingerprint.
 *
 * Generates deterministic-but-rotating tokens that change once every 24h (UTC).
 * Because the value depends only on the current UTC day, server render and
 * client hydration produce the same markup, so there is no hydration mismatch.
 *
 * The tokens are injected as extra class names / data attributes / comments so
 * the page source is byte-different every day without any visual change.
 */

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Index of the current UTC day (days since epoch). */
export function dayIndex(now: number = Date.now()) {
  return Math.floor(now / DAY_MS);
}

function hash(str: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** Stable-per-day token for a given key. Always starts with a letter. */
export function fpToken(key: string, now?: number) {
  const h = hash(`${dayIndex(now)}::${key}`);
  const letters = "abcdefghijklmnopqrstuvwxyz";
  return letters[h % 26] + (h >>> 5).toString(36) + ((h * 2654435761) >>> 0).toString(36).slice(0, 4);
}

/** Class name safe to append to any element (no styles attached). */
export function fpClass(key: string, now?: number) {
  return `x-${fpToken(key, now)}`;
}

/** Data attributes to spread onto an element. */
export function fpAttrs(key: string, now?: number): Record<string, string> {
  return { [`data-${fpToken(`attr-${key}`, now)}`]: fpToken(`val-${key}`, now) };
}

/** Build id that rotates daily — useful for cache-busting and comments. */
export function fpBuildId(now?: number) {
  return `${dayIndex(now)}-${fpToken("build", now)}`;
}
