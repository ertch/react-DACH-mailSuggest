import { useEffect, useRef, useState } from 'react';
import { findClosestProvider } from './utils';

export interface UseEmailSuggestionOptions {
  /** Max edit distance for typo detection (default: 2) */
  maxDistance?: number;
  /** Debounce delay in ms (default: 300). Set to 0 for immediate evaluation. */
  debounceMs?: number;
  /**
   * Domain list to check against. Default: `DACH_DOMAINS`.
   * Import and spread to extend: `[...DACH_DOMAINS, 'company.com']`.
   */
  domains?: readonly string[];
  /** Skip detection entirely (suggestion stays null) */
  disabled?: boolean;
  /** Optional regex the corrected email must match; suggestion is suppressed if it doesn't. */
  emailPattern?: RegExp;
}

export interface UseEmailSuggestionResult {
  /** Debounced suggestion for the current email, or null */
  suggestion: string | null;
  /**
   * Compute the correction synchronously, bypassing debounce.
   * Useful at submit-time to catch typos the user blurred past.
   */
  getCorrected: () => string | null;
}

function compute(
  email: string,
  maxDistance: number,
  domains: readonly string[] | undefined,
  emailPattern: RegExp | undefined
): string | null {
  const at = email.indexOf('@');
  if (at === -1 || at === email.length - 1) return null;
  const match = findClosestProvider(email.substring(at + 1), maxDistance, domains);
  if (!match) return null;
  const corrected = email.substring(0, at + 1) + match;
  if (emailPattern && !emailPattern.test(corrected)) return null;
  return corrected;
}

/**
 * Reactive, SSR-safe email typo detection.
 *
 * @example
 * const { suggestion, getCorrected } = useEmailSuggestion(email);
 * if (suggestion) return <div>Meinten Sie {suggestion}?</div>;
 */
export function useEmailSuggestion(
  email: string,
  options: UseEmailSuggestionOptions = {}
): UseEmailSuggestionResult {
  const {
    maxDistance = 2,
    debounceMs = 300,
    domains,
    disabled = false,
    emailPattern,
  } = options;

  const [suggestion, setSuggestion] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (disabled) {
      setSuggestion(null);
      return;
    }

    const run = () => setSuggestion(compute(email, maxDistance, domains, emailPattern));

    if (debounceMs <= 0) {
      run();
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(run, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [email, maxDistance, debounceMs, disabled, domains, emailPattern]);

  const getCorrected = () =>
    disabled ? null : compute(email, maxDistance, domains, emailPattern);

  return { suggestion, getCorrected };
}
