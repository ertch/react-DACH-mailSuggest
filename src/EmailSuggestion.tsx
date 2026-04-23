import React, { useEffect, useRef } from 'react';
import { useEmailSuggestion, UseEmailSuggestionOptions } from './useEmailSuggestion';

export interface EmailSuggestionProps extends UseEmailSuggestionOptions {
  /** Current email value from your state */
  email: string;
  /** Called when the user accepts the suggestion */
  onAccept: (correctedEmail: string) => void;
  /** Fires whenever a non-null suggestion is displayed */
  onSuggest?: (suggestion: string) => void;
  /** CSS class for the warning container */
  warningClassName?: string;
  /** CSS class for the clickable suggestion */
  suggestionClassName?: string;
  /** Text shown before the clickable suggestion */
  warningText?: string;
  /** Text appended after the suggestion (default: "?") */
  suffixText?: string;
  /** Custom renderer; overrides default markup */
  render?: (params: { suggestion: string; accept: () => void }) => React.ReactNode;
}

const EmailSuggestion: React.FC<EmailSuggestionProps> = ({
  email,
  onAccept,
  onSuggest,
  warningClassName = 'email-warning',
  suggestionClassName = 'email-suggestion',
  warningText,
  suffixText = '?',
  render,
  ...hookOptions
}) => {
  const { suggestion } = useEmailSuggestion(email, hookOptions);

  const onSuggestRef = useRef(onSuggest);
  onSuggestRef.current = onSuggest;
  useEffect(() => {
    if (suggestion) onSuggestRef.current?.(suggestion);
  }, [suggestion]);

  if (!suggestion) return null;

  const accept = () => onAccept(suggestion);

  if (render) return <>{render({ suggestion, accept })}</>;

  const label = warningText ?? 'Dieser Mailprovider ist uns nicht bekannt. Meinten Sie: ';

  return (
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
        onClick={accept}
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
  );
};

export default EmailSuggestion;
