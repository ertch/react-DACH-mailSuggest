// Common email domains in the D-A-CH region (all lowercase)
export const DACH_DOMAINS: readonly string[] = [
  // Germany
  'gmx.de',
  'gmx.net',
  'web.de',
  't-online.de',
  'freenet.de',
  'posteo.de',
  'mailbox.org',
  '1und1.de',
  'ionos.de',
  'arcor.de',
  'vodafone.de',
  'o2online.de',

  // Austria
  'gmx.at',
  'aon.at',
  'a1.net',
  'chello.at',
  'three.at',
  'magenta.at',

  // Switzerland
  'gmx.ch',
  'bluewin.ch',
  'sunrise.ch',
  'hispeed.ch',
  'swissonline.ch',

  // International (common in DACH region)
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'outlook.de',
  'hotmail.com',
  'hotmail.de',
  'live.com',
  'live.de',
  'yahoo.com',
  'yahoo.de',
  'icloud.com',
  'me.com',
  'protonmail.com',
  'proton.me',
];

// Pre-built Set for O(1) lookups
const KNOWN_DOMAINS_SET = new Set(DACH_DOMAINS.map(d => d.toLowerCase()));

/**
 * Optimal String Alignment distance (restricted Damerau-Levenshtein).
 * Handles transpositions as a single edit: "gmial" -> "gmail" = 1.
 * Uses 3-row rolling array: O(min(n,m)) space.
 * Early termination when all values in current row exceed maxDistance.
 */
export function damerauLevenshteinDistance(
  a: string,
  b: string,
  maxDistance?: number
): number {
  if (a.length > b.length) {
    [a, b] = [b, a];
  }

  const n = a.length;
  const m = b.length;

  if (n === 0) return maxDistance !== undefined ? Math.min(m, maxDistance + 1) : m;
  if (m === 0) return maxDistance !== undefined ? Math.min(n, maxDistance + 1) : n;
  if (maxDistance !== undefined && (m - n) > maxDistance) return maxDistance + 1;

  let prevPrev: number[] = new Array(n + 1);
  let prev: number[] = new Array(n + 1);
  let curr: number[] = new Array(n + 1);

  for (let i = 0; i <= n; i++) {
    prev[i] = i;
  }

  for (let j = 1; j <= m; j++) {
    curr[0] = j;
    let rowMin = j;

    for (let i = 1; i <= n; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;

      curr[i] = Math.min(
        curr[i - 1] + 1,       // insertion
        prev[i] + 1,           // deletion
        prev[i - 1] + cost     // substitution
      );

      // Transposition
      if (
        j > 1 && i > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1]
      ) {
        curr[i] = Math.min(curr[i], prevPrev[i - 2] + cost);
      }

      if (curr[i] < rowMin) rowMin = curr[i];
    }

    if (maxDistance !== undefined && rowMin > maxDistance) {
      return maxDistance + 1;
    }

    const tmp = prevPrev;
    prevPrev = prev;
    prev = curr;
    curr = tmp;
  }

  return prev[n];
}

/**
 * Find the closest known domain using Damerau-Levenshtein distance.
 * Returns null if the domain is already known or no close match exists.
 */
export function findClosestProvider(
  inputDomain: string,
  maxDistance: number = 2
): string | null {
  if (!inputDomain) return null;

  const domain = inputDomain.toLowerCase();
  if (KNOWN_DOMAINS_SET.has(domain)) return null;

  let bestDistance = maxDistance + 1;
  let bestMatch: string | null = null;

  for (const provider of DACH_DOMAINS) {
    const distance = damerauLevenshteinDistance(domain, provider, maxDistance);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestMatch = provider;
      if (bestDistance === 1) break;
    }
  }

  return bestDistance <= maxDistance ? bestMatch : null;
}

/** Check if a domain is a known D-A-CH provider. */
export function isKnownProvider(domain: string): boolean {
  return KNOWN_DOMAINS_SET.has(domain.toLowerCase());
}
