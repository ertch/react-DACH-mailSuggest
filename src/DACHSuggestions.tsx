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
}

const DACHSuggestions: React.FC<DACHSuggestionsProps> = ({
  id,
  maxDistance = 2,
  debounceMs = 300,
  warningClassName = 'email-warning',
  suggestionClassName = 'email-suggestion',
  warningText,
}) => {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const compute = useCallback((value: string) => {
    const at = value.indexOf('@');
    if (at === -1 || at === value.length - 1) { setSuggestion(null); return; }
    const domain = value.substring(at + 1);
    const match = findClosestProvider(domain, maxDistance);
    setSuggestion(match ? value.substring(0, at + 1) + match : null);
  }, [maxDistance]);

  useEffect(() => {
    const escapedId = CSS.escape(id);
    const input = document.querySelector<HTMLInputElement>(`[data-dach-suggestion="${escapedId}"]`);
    if (!input) return;
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
  }, [id, debounceMs, compute]);

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
    setSuggestion(null);
  }, [suggestion]);

  const label = warningText ?? 'Dieser Mailprovider ist uns nicht bekannt. Meinten Sie: ';

  return suggestion ? (
    <div
      className={warningClassName}
      style={{ color: '#b45309', fontSize: '0.9em', marginTop: '4px' }}
    >
      {label}
      <span
        role="button"
        tabIndex={0}
        className={suggestionClassName}
        onClick={handleApply}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleApply();
        }}
        style={{
          color: '#2563eb',
          cursor: 'pointer',
          textDecoration: 'underline',
          fontWeight: 500,
        }}
      >
        {suggestion}
      </span>
      ?
    </div>
  ) : null;
};

export default DACHSuggestions;
