import React, { useState, useRef, useEffect, useCallback } from 'react';
import { findClosestProvider } from './utils';

export interface DACHSuggestionsProps {
  /** Links this component to an <input data-dach-suggestion="thisId" /> */
  id: string;
  /** Max edit distance for typo detection (default: 2) */
  maxDistance?: number;
  /** Debounce delay in ms (default: 300) */
  debounceMs?: number;
  /** CSS class for the warning container */
  warningClassName?: string;
  /** CSS class for the clickable suggestion */
  suggestionClassName?: string;
  /** Text shown before the clickable suggestion */
  warningText?: string;
  /** Text appended after the suggestion (default: "?") */
  suffixText?: string;
  /**
   * Domain list to check against. Default: `DACH_DOMAINS`.
   * Import and spread to extend: `[...DACH_DOMAINS, 'company.com']`.
   */
  domains?: readonly string[];
  /** Disable typo detection (no listeners attached) */
  disabled?: boolean;
  /** Fires when a suggestion is displayed */
  onSuggest?: (suggestion: string) => void;
  /** Fires when the user accepts the suggestion */
  onAccept?: (value: string) => void;
}

const DACHSuggestions: React.FC<DACHSuggestionsProps> = ({
  id,
  maxDistance = 2,
  debounceMs = 300,
  warningClassName = 'email-warning',
  suggestionClassName = 'email-suggestion',
  warningText,
  suffixText = '?',
  domains,
  disabled = false,
  onSuggest,
  onAccept,
}) => {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onSuggestRef = useRef(onSuggest);
  onSuggestRef.current = onSuggest;

  const compute = useCallback((value: string) => {
    const at = value.indexOf('@');
    if (at === -1 || at === value.length - 1) { setSuggestion(null); return; }
    const domain = value.substring(at + 1);
    const match = findClosestProvider(domain, maxDistance, domains);
    const next = match ? value.substring(0, at + 1) + match : null;
    setSuggestion(next);
    if (next) onSuggestRef.current?.(next);
  }, [maxDistance, domains]);

  useEffect(() => {
    if (disabled) return;
    if (typeof document === 'undefined') return;

    const escapedId = CSS.escape(id);
    const selector = `[data-dach-suggestion="${escapedId}"]`;
    const matches = document.querySelectorAll<HTMLInputElement>(selector);

    if (matches.length === 0) return;
    if (matches.length > 1 && process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(
        `[DACHSuggestions] Multiple inputs share data-dach-suggestion="${id}"; ` +
        `only the first is tracked. Use a unique id per instance.`
      );
    }

    const input = matches[0];
    inputRef.current = input;

    const handleInput = () => {
      const v = input.value;
      const at = v.indexOf('@');

      if (timerRef.current) clearTimeout(timerRef.current);
      if (at !== -1 && at < v.length - 1) {
        timerRef.current = setTimeout(() => compute(v), debounceMs);
      } else {
        setSuggestion(null);
      }
    };

    const handleBlur = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      compute(input.value);
    };

    input.addEventListener('input', handleInput);
    input.addEventListener('blur', handleBlur);

    return () => {
      input.removeEventListener('input', handleInput);
      input.removeEventListener('blur', handleBlur);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [id, debounceMs, compute, disabled]);

  const handleApply = useCallback(() => {
    if (!suggestion || !inputRef.current) return;
    const nativeSet = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype, 'value'
    )?.set;
    if (nativeSet) {
      nativeSet.call(inputRef.current, suggestion);
      inputRef.current.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      inputRef.current.value = suggestion;
    }
    onAccept?.(suggestion);
    setSuggestion(null);
  }, [suggestion, onAccept]);

  const label = warningText ?? 'Dieser Mailprovider ist uns nicht bekannt. Meinten Sie: ';

  return suggestion ? (
    <div
      className={warningClassName}
      role="status"
      aria-live="polite"
      style={{ color: '#b45309', fontSize: '0.9em', marginTop: '4px' }}
    >
      {label}
      <button
        type="button"
        className={suggestionClassName}
        onClick={handleApply}
        style={{
          background: 'none',
          border: 0,
          padding: 0,
          font: 'inherit',
          color: '#2563eb',
          cursor: 'pointer',
          textDecoration: 'underline',
          fontWeight: 500,
        }}
      >
        {suggestion}
      </button>
      {suffixText}
    </div>
  ) : null;
};

export default DACHSuggestions;
