import React, { useState, useRef, useEffect, useCallback } from 'react';
import EmailSuggestion from './EmailSuggestion';

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
  /** Optional regex the corrected email must match; suggestion is suppressed if it doesn't. */
  emailPattern?: RegExp;
  /** Fires when a suggestion is displayed */
  onSuggest?: (suggestion: string) => void;
  /** Fires when the user accepts the suggestion */
  onAccept?: (value: string) => void;
}

/**
 * @deprecated Prefer `<EmailSuggestion>` or `useEmailSuggestion`.
 * The `data-dach-suggestion` + `document.querySelector` approach does not
 * compose well with controlled inputs, form libraries, SSR, or shadow DOM.
 * This component is kept for backwards compatibility and is internally a
 * thin DOM-to-state bridge over the new API.
 */
const DACHSuggestions: React.FC<DACHSuggestionsProps> = ({
  id,
  maxDistance = 2,
  debounceMs = 300,
  warningClassName,
  suggestionClassName,
  warningText,
  suffixText,
  domains,
  disabled = false,
  emailPattern,
  onSuggest,
  onAccept,
}) => {
  const [email, setEmail] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

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
    setEmail(input.value);

    const handleInput = () => setEmail(input.value);
    const handleBlur = () => setEmail(input.value);

    input.addEventListener('input', handleInput);
    input.addEventListener('blur', handleBlur);

    return () => {
      input.removeEventListener('input', handleInput);
      input.removeEventListener('blur', handleBlur);
    };
  }, [id, disabled]);

  const handleAccept = useCallback((corrected: string) => {
    if (inputRef.current) {
      const nativeSet = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype, 'value'
      )?.set;
      if (nativeSet) {
        nativeSet.call(inputRef.current, corrected);
        inputRef.current.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        inputRef.current.value = corrected;
      }
    }
    setEmail(corrected);
    onAccept?.(corrected);
  }, [onAccept]);

  return (
    <EmailSuggestion
      email={email}
      onAccept={handleAccept}
      onSuggest={onSuggest}
      maxDistance={maxDistance}
      debounceMs={debounceMs}
      domains={domains}
      disabled={disabled}
      emailPattern={emailPattern}
      warningClassName={warningClassName}
      suggestionClassName={suggestionClassName}
      warningText={warningText}
      suffixText={suffixText}
    />
  );
};

export default DACHSuggestions;
