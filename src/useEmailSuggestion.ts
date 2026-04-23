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
  domains: readonly string[] | undefined
): string | null {
  const at = email.indexOf('@');
  if (at === -1 || at === email.length - 1) return null;
  const match = findClosestProvider(email.substring(at + 1), maxDistance, domains);
  return match ? email.substring(0, at + 1) + match : null;
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
  } = options;

  const [suggestion, setSuggestion] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const emailRef = useRef(email);
  emailRef.current = email;
  const maxDistanceRef = useRef(maxDistance);
  maxDistanceRef.current = maxDistance;
  const domainsRef = useRef(domains);
  domainsRef.current = domains;

  useEffect(() => {
    if (disabled) {
      setSuggestion(null);
      return;
    }

    const run = () => setSuggestion(compute(email, maxDistance, domains));

    if (debounceMs <= 0) {
      run();
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(run, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [email, maxDistance, debounceMs, disabled, domains]);

  const getCorrected = () =>
    disabled ? null : compute(emailRef.current, maxDistanceRef.current, domainsRef.current);

  return { suggestion, getCorrected };
}
